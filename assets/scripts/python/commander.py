
import sys

from core.renderer_worker import run_worker


def build_commands():
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


def print_commands(commands):
    print("Available commands:")
    for cmd in commands.values():
        print(f"  {cmd.name}: {cmd.description}")


def main():
    if len(sys.argv) >= 2 and sys.argv[1] == "--statistics-worker":
        from analysis.mice import run_mice
        from analysis.scientific import run_scientific

        run_worker(
            {},
            {
                "statistics:mice": run_mice,
                "statistics:run": run_scientific,
            },
        )
        return

    renderer_commands, commands = build_commands()
    if len(sys.argv) < 2:
        print_commands(commands)
        return

    command_name = sys.argv[1]
    if command_name == "--worker":
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
