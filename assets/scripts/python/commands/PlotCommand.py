import matplotlib.pyplot as plt
import base64
from io import BytesIO
from core.Command import Command
from commands.utils import load_payload, normalize_categories, to_numeric_list



class PlotCommand(Command):
    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0]
        data = load_payload(input_arg, use_json)

        categories = normalize_categories(data.get('categories', []))
        series = data.get('series', [])
        if not categories and not series:
            categories = list(data.keys())
            series = [{
                'name': data.get('title', 'Series'),
                'values': list(data.values())
            }]

        plt.figure(figsize=(10, 8))
        x = list(range(len(categories)))
        normalized_series = []

        for index, entry in enumerate(series):
            values = to_numeric_list(entry.get('values', []), len(categories))
            if not len(values):
                continue
            normalized_series.append({
                'name': entry.get('name', f'Series {index + 1}'),
                'values': values,
            })

        if not normalized_series:
            raise ValueError("Bar plot renderer could not build any numeric series from the payload.")

        total_series = max(1, len(normalized_series))
        width = 0.8 / total_series

        for index, entry in enumerate(normalized_series):
            offsets = [item + (index - (total_series - 1) / 2) * width for item in x]
            plt.bar(offsets, entry['values'], width=width, label=entry['name'])

        plt.xticks(list(x), categories, rotation=35, ha='right')
        if len(normalized_series) > 1:
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
