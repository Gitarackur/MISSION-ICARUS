import matplotlib.pyplot as plt
import base64
from io import BytesIO
from core.Command import Command
from commands.utils import load_payload, to_numeric_list



class ScatterPlotCommand(Command):
    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0]
        data = load_payload(input_arg, use_json)

        series = data.get('series', [])
        if not series and 'x' in data and 'y' in data:
            series = [{
                'name': data.get('title', 'Series'),
                'x': data.get('x', []),
                'y': data.get('y', []),
                'labels': data.get('labels', [])
            }]

        plt.figure(figsize=(10, 8))
        for entry in series:
            x = to_numeric_list(entry.get('x', []))
            y = to_numeric_list(entry.get('y', []), len(x))
            label = entry.get('name', 'Series')
            if not x or not y:
                continue
            plt.scatter(x, y, label=label, alpha=0.65)

        if len(series) > 1:
            plt.legend()

        plt.xlabel(data.get('xAxisLabel', 'X'))
        plt.ylabel(data.get('yAxisLabel', 'Y'))
        plt.title(data.get('title', 'Scatter Plot'))
        plt.tight_layout()

        if preview:
            plt.show()
        else:
            buf = BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)
