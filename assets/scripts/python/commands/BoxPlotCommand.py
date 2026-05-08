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

        series = data.get('series', [])
        if not series:
            series = [{'name': key, 'values': values} for key, values in data.items()]
        labels = [entry.get('name', 'Series') for entry in series]
        values = [entry.get('values', []) for entry in series]

        plt.figure(figsize=(8, 6))
        plt.boxplot(values, labels=labels)
        plt.title(data.get('title', 'Box Plot'))
        plt.ylabel(data.get('yAxisLabel', 'Values'))
        plt.tight_layout()

        if preview:
            plt.show()
        else:
            buf = BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)

