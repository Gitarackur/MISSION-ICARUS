

import os
import subprocess

SCRIPT_DIR = "scripts/python"

print(f"Preparing all Python scripts in {SCRIPT_DIR}...")

def main():
    for item in os.listdir(SCRIPT_DIR):
        print(f"Found item: {item}")
        print(f"Full path: {os.path.join(SCRIPT_DIR, item)}")

        if os.path.isfile(os.path.join(SCRIPT_DIR, item)) and item.endswith(".py"):
            print(f"Preparing {item}...")
            log_file = f"logs/{item}.log"
            os.makedirs("logs", exist_ok=True)
            
            with open(log_file, 'w') as f:
                process = subprocess.run(
                    ["pipenv", "run", "prepare", item],
                    stdout=f,
                    stderr=subprocess.STDOUT,
                    input="yes\n" * 100,
                    text=True
                )
            print(f"Process completed with exit code: {process.returncode}")  
            print(f"Prepared {item}")

if __name__ == "__main__":
    main()