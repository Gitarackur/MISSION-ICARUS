
import sys
from typing import Dict

from core.Command import Command
from core.renderer_worker import run_worker
from core.worker_protocol import (
    CommandName,
    RendererCommand,
    RequestHandler,
    STATISTICS_RUN,
    STATISTICS_WORKER_FLAG,
    StatisticsCommand,
    WorkerMode,
    WORKER_FLAG,
)


def build_commands() -> tuple[
    Dict[RendererCommand, Command],
    Dict[CommandName, Command],
]:
    # Plotting imports are intentionally lazy. The dedicated statistics worker
    # should not initialize Matplotlib, its font cache, pandas or sklearn before
    # a numerical job can start.
    from commands.PlotCommand import PlotCommand
    from commands.BoxPlotCommand import BoxPlotCommand
    from commands.ScatterPlotCommand import ScatterPlotCommand
    from commands.HeatmapCommand import HeatmapCommand
    from commands.VolcanoPlotCommand import VolcanoPlotCommand
    from commands.PCAPlotCommand import PCAPlotCommand
    from commands.CallTreasure import CallTreasure

    renderer_commands = {
        "plot": PlotCommand("plot", "Generates a bar chart from the given data"),
        "boxplot": BoxPlotCommand("boxplot", "Generates a box plot from the given data"),
        "scatter": ScatterPlotCommand("scatter", "Generates a scatter plot from the given data"),
        "heatmap": HeatmapCommand("heatmap", "Generates a heatmap from the given data"),
        "volcano": VolcanoPlotCommand("volcano", "Generates a volcano plot for differential expression analysis"),
        "pca": PCAPlotCommand("pca", "Generates a PCA plot from the given data"),
    }
    return renderer_commands, {
        **renderer_commands,
        "call_treasure": CallTreasure("call_treasure", "Calls the Treasure API"),
    }


def print_commands(commands: Dict[CommandName, Command]):
    print("Available commands:")
    for cmd in commands.values():
        print(f"  {cmd.name}: {cmd.description}")


def run_statistics_worker() -> bool:
    if len(sys.argv) >= 2 and sys.argv[1] == STATISTICS_WORKER_FLAG:
        from analysis.scientific import run_scientific

        statistics_handlers: Dict[StatisticsCommand, RequestHandler] = {
            STATISTICS_RUN: run_scientific,
        }
        run_worker({}, statistics_handlers)
        return True
    return False


def main():
    # The dedicated statistics worker must never fall through to the renderer
    # command path after its stdin reaches EOF, otherwise Matplotlib, pandas
    # and sklearn get initialized and stray text is printed to the protocol fifo.
    if run_statistics_worker():
        return

    renderer_commands, commands = build_commands()
    if len(sys.argv) < 2:
        print_commands(commands)
        return

    command_name = sys.argv[1]
    if command_name == WORKER_FLAG:
        run_worker(renderer_commands)
        return
    command = commands.get(command_name)

    if not command:
        print(f"Unknown command: {command_name}")
        print_commands(commands)
        return

    command.execute()

if __name__ == "__main__":
    main()

