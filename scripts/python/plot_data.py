import sys
import json
import matplotlib.pyplot as plt
import base64
from io import BytesIO

def main():
    preview = "--preview" in sys.argv
    use_json = "--use-json" in sys.argv

    input_arg = sys.argv[1]

    print("Input Argument:", input_arg, file=sys.stderr)

    if use_json:
        data = json.loads(input_arg)
    else:
        try:
            with open(input_arg) as f:
                data = json.load(f)
        except (FileNotFoundError, OSError):
            data = json.loads(input_arg)

    labels = list(data.keys())
    values = list(data.values())

    plt.figure(figsize=(6,4))
    plt.bar(labels, values)
    plt.title('Python Bar Chart')
    plt.tight_layout()

    if preview:
        # Show the chart in a window
        plt.show()
    else:
        buf = BytesIO()
        plt.savefig(buf, format='png')
        buf.seek(0)

        img_base64 = base64.b64encode(buf.read()).decode('utf-8')
        print(img_base64)

if __name__ == "__main__":
    main()
