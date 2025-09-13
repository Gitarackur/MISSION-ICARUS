
import sys

from commands.PlotCommand import PlotCommand
from commands.CallTreasure import CallTreasure

commands = {
  "plot": PlotCommand("plot", "Generates a plot from the given data"),
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
