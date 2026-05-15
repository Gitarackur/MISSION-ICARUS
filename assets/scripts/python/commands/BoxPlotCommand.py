import matplotlib.pyplot as plt
import base64
from io import BytesIO
from core.Command import Command
from commands.utils import load_payload, to_numeric_list



class BoxPlotCommand(Command):
    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0]
        data = load_payload(input_arg, use_json)

        series = data.get('series', [])
        if not series:
            series = [{'name': key, 'values': values} for key, values in data.items()]
        normalized_series = [
            {
                'name': entry.get('name', 'Series'),
                'values': to_numeric_list(entry.get('values', [])),
            }
            for entry in series
        ]
        normalized_series = [entry for entry in normalized_series if len(entry['values']) > 0]

        if not normalized_series:
            raise ValueError("Box plot renderer could not build any numeric series from the payload.")

        labels = [entry['name'] for entry in normalized_series]
        values = [entry['values'] for entry in normalized_series]

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
