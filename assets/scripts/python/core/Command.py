import sys

class Command:
    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description
        self.args = sys.argv[2:]

    def execute(self):
        print(f"Executing command: {self.name}")