import contextlib
import copy
import io
import json
import sys
import traceback

import matplotlib.pyplot as plt


def _emit_worker_message(message):
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


def run_worker(commands):
    _emit_worker_message({"type": "ready"})

    for line in sys.stdin:
        if not line.strip():
            continue

        try:
            request = json.loads(line)
            if (
                not isinstance(request, dict)
                or not isinstance(request.get("id"), int)
            ):
                raise ValueError("Worker request must contain a numeric id")
        except (json.JSONDecodeError, ValueError) as error:
            print(f"Ignoring invalid worker request: {error}", file=sys.stderr)
            continue

        request_id = request["id"]
        try:
            result = _execute_worker_command(
                commands,
                request.get("command"),
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
                plt.close("all")
            except Exception:
                pass
            _emit_worker_message({
                "id": request_id,
                "ok": False,
                "error": f"{type(error).__name__}: {error}",
            })
