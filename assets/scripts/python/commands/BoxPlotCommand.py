import json
import matplotlib.pyplot as plt
import base64
from io import BytesIO
from core.Command import Command



class BoxPlotCommand(Command):
    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0]

        if use_json:
            data = json.loads(input_arg)
        else:
            try:
                with open(input_arg) as f:
                    data = json.load(f)
            except (FileNotFoundError, OSError):
                data = json.loads(input_arg)

        # Expected format: {"group1": [values], "group2": [values], ...}
        labels = list(data.keys())
        values = [data[key] for key in labels]

        plt.figure(figsize=(8, 6))
        plt.boxplot(values, labels=labels)
        plt.title('Box Plot')
        plt.ylabel('Values')
        plt.tight_layout()

        if preview:
            plt.show()
        else:
            buf = BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)



