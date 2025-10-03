import json
import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import base64
from io import BytesIO
from core.Command import Command



class HeatmapCommand(Command):
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

        # Expected format: {"matrix": [[values]], "row_labels": [...], "col_labels": [...]}
        matrix = np.array(data['matrix'])
        row_labels = data.get('row_labels', None)
        col_labels = data.get('col_labels', None)

        plt.figure(figsize=(10, 8))
        sns.heatmap(matrix, annot=True, fmt='.2f', cmap='coolwarm',
                    xticklabels=col_labels if col_labels else 'auto',
                    yticklabels=row_labels if row_labels else 'auto')
        plt.title('Heatmap')
        plt.tight_layout()

        if preview:
            plt.show()
        else:
            buf = BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)
