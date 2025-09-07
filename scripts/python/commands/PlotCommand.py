
import json
import matplotlib.pyplot as plt
import base64
from io import BytesIO

from core.Command import Command


class PlotCommand(Command):
    def __init__(self, name, description):
        super().__init__(name, description)

    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0];

        open("f.txt", "w").write(str(self.args))

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