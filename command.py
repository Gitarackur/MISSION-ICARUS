
import sys

from scripts.python.PlotCommand import PlotCommand

commands = {
  "plot": PlotCommand("plot", "Generates a plot from the given data")
}


def main():
    if len(sys.argv) < 2:
        print("Please provide a command.")
        print("Available commands:")
        for cmd in commands.values():
            print(f"  {cmd.name}: {cmd.description}")
        return
    
    print("Arguments:", sys.argv, file=sys.stderr)

    command_name = sys.argv[1]
    command = commands.get(command_name)

    if not command:
        print(f"Unknown command: {command_name}")
        print("Available commands:")
        for cmd in commands.values():
            print(f"  {cmd.name}: {cmd.description}")
        return

    command.execute()

if __name__ == "__main__":
    main()
