import contextlib
import copy
import io
import json
import sys
import threading
import time
import traceback

_output_lock = threading.Lock()


def _emit_worker_message(message):
    with _output_lock:
        sys.stdout.write(json.dumps(message, separators=(",", ":")) + "\n")
        sys.stdout.flush()


def _execute_worker_command(commands, command_name, payload):
    command_template = commands.get(command_name)

    if not command_template:
        raise ValueError(f"Unsupported renderer command: {command_name}")

    command = copy.copy(command_template)
    command.args = [json.dumps(payload, separators=(",", ":")), "--use-json"]
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        command.execute()

    result = output.getvalue().strip()
    if not result:
        raise RuntimeError(f"Renderer command '{command_name}' returned no image")
    return result


def run_worker(commands, request_handlers=None):
    request_handlers = request_handlers or {}
    _emit_worker_message({"type": "ready"})

    for line in sys.stdin:
        if not line.strip():
            continue

        try:
            request = json.loads(line)
            if (
                not isinstance(request, dict)
                or type(request.get("id")) is not int
            ):
                raise ValueError("Worker request must contain a numeric id")
        except (json.JSONDecodeError, ValueError) as error:
            print(f"Ignoring invalid worker request: {error}", file=sys.stderr)
            continue

        request_id = request["id"]
        heartbeat_stop = threading.Event()

        def emit_progress(progress=None, detail=None):
            message = {"id": request_id, "type": "progress"}
            if progress is not None:
                message["progress"] = max(0.0, min(1.0, float(progress)))
            if detail:
                message["detail"] = str(detail)
            _emit_worker_message(message)

        def heartbeat_loop():
            while not heartbeat_stop.wait(5.0):
                _emit_worker_message({"id": request_id, "type": "heartbeat"})

        heartbeat = threading.Thread(
            target=heartbeat_loop,
            name=f"icarus-worker-heartbeat-{request_id}",
            daemon=True,
        )
        heartbeat.start()
        try:
            command_name = request.get("command")
            handler = request_handlers.get(command_name)
            if handler:
                result = handler(request.get("payload") or {}, emit_progress)
            else:
                result = _execute_worker_command(
                    commands,
                    command_name,
                    request.get("payload"),
                )
            _emit_worker_message({
                "id": request_id,
                "ok": True,
                "result": result,
            })
        except Exception as error:
            traceback.print_exc(file=sys.stderr)
            try:
                import matplotlib.pyplot as plt

                plt.close("all")
            except Exception:
                pass
            _emit_worker_message({
                "id": request_id,
                "ok": False,
                "error": f"{type(error).__name__}: {error}",
            })
        finally:
            heartbeat_stop.set()
