import json
import matplotlib.pyplot as plt
import base64
from io import BytesIO
from core.Command import Command



class ScatterPlotCommand(Command):
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

        # Expected format: {"x": [x_values], "y": [y_values], "labels": [optional]}
        x = data['x']
        y = data['y']
        labels = data.get('labels', None)

        plt.figure(figsize=(8, 6))
        if labels:
            unique_labels = list(set(labels))
            for label in unique_labels:
                indices = [i for i, l in enumerate(labels) if l == label]
                plt.scatter([x[i] for i in indices], [y[i] for i in indices], label=label, alpha=0.6)
            plt.legend()
        else:
            plt.scatter(x, y, alpha=0.6)
        
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.title('Scatter Plot')
        plt.tight_layout()

        if preview:
            plt.show()
        else:
            buf = BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)



