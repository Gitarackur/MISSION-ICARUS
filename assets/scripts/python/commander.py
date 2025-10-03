
import sys

from commands.PlotCommand import PlotCommand
from commands.CallTreasure import CallTreasure

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

def main():
    if len(sys.argv) < 2:
        print_commands()
        return

    command_name = sys.argv[1]
    command = commands.get(command_name)

    if not command:
        print(f"Unknown command: {command_name}")
        print_commands()
        return

    command.execute()

if __name__ == "__main__":
    main()
