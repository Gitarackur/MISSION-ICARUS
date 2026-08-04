
import contextlib
import io
import json
import sys
import traceback

from commands.PlotCommand import PlotCommand
from commands.BoxPlotCommand import BoxPlotCommand
from commands.ScatterPlotCommand import ScatterPlotCommand
from commands.HeatmapCommand import HeatmapCommand
from commands.VolcanoPlotCommand import VolcanoPlotCommand
from commands.PCAPlotCommand import PCAPlotCommand
from commands.CallTreasure import CallTreasure

commands = {
    "plot": PlotCommand("plot", "Generates a bar chart from the given data"),
    "boxplot": BoxPlotCommand("boxplot", "Generates a box plot from the given data"),
    "scatter": ScatterPlotCommand("scatter", "Generates a scatter plot from the given data"),
    "heatmap": HeatmapCommand("heatmap", "Generates a heatmap from the given data"),
    "volcano": VolcanoPlotCommand("volcano", "Generates a volcano plot for differential expression analysis"),
    "pca": PCAPlotCommand("pca", "Generates a PCA plot from the given data"),
    "call_treasure": CallTreasure("call_treasure", "Calls the Treasure API")
}


def print_commands():
    print("Available commands:")
    for cmd in commands.values():
        print(f"  {cmd.name}: {cmd.description}")


def emit_worker_message(message):
    sys.stdout.write(json.dumps(message, separators=(",", ":")) + "\n")
    sys.stdout.flush()


def execute_worker_command(command_name, payload):
    command = commands.get(command_name)

    if not command or command_name == "call_treasure":
        raise ValueError(f"Unsupported renderer command: {command_name}")

    command.args = [json.dumps(payload, separators=(",", ":")), "--use-json"]
    output = io.StringIO()
    with contextlib.redirect_stdout(output):
        command.execute()

    result = output.getvalue().strip()
    if not result:
        raise RuntimeError(f"Renderer command '{command_name}' returned no image")
    return result


def run_worker():
    emit_worker_message({"type": "ready"})

    for line in sys.stdin:
        if not line.strip():
            continue

        request_id = None
        try:
            request = json.loads(line)
            request_id = request.get("id")
            result = execute_worker_command(
                request.get("command"), request.get("payload")
            )
            emit_worker_message({
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
            emit_worker_message({
                "id": request_id,
                "ok": False,
                "error": f"{type(error).__name__}: {error}",
            })

def main():
    if len(sys.argv) < 2:
        print_commands()
        return

    command_name = sys.argv[1]
    if command_name == "--worker":
        run_worker()
        return
    command = commands.get(command_name)

    if not command:
        print(f"Unknown command: {command_name}")
        print_commands()
        return

    command.execute()

if __name__ == "__main__":
    main()
