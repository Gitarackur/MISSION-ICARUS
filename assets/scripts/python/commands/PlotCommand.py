import json
import matplotlib.pyplot as plt
import base64
from io import BytesIO
from core.Command import Command



class PlotCommand(Command):
    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0];

        if use_json:
            data = json.loads(input_arg)
        else:
            try:
                with open(input_arg) as f:
                    data = json.load(f)
            except (FileNotFoundError, OSError):
                data = json.loads(input_arg)

        categories = data.get('categories', [])
        series = data.get('series', [])
        if not categories and not series:
            categories = list(data.keys())
            series = [{
                'name': data.get('title', 'Series'),
                'values': list(data.values())
            }]

        plt.figure(figsize=(10, 8))
        x = range(len(categories))
        total_series = max(1, len(series))
        width = 0.8 / total_series

        for index, entry in enumerate(series):
            offsets = [item + (index - (total_series - 1) / 2) * width for item in x]
            plt.bar(offsets, entry.get('values', []), width=width, label=entry.get('name', f'Series {index + 1}'))

        plt.xticks(list(x), categories, rotation=35, ha='right')
        if len(series) > 1:
            plt.legend()
        plt.xlabel(data.get('xAxisLabel', 'X Axis'))
        plt.ylabel(data.get('yAxisLabel', 'Y Axis'))
        plt.title(data.get('title', 'Bar Plot'))
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
