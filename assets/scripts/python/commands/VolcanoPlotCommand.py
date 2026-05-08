import json
import matplotlib.pyplot as plt
import numpy as np
import base64
from io import BytesIO
from core.Command import Command



class VolcanoPlotCommand(Command):
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

        if 'x' in data and 'y' in data:
            x_values = np.array(data['x'])
            y_values = np.array(data['y'])
            y_transform = data.get('yTransform', 'none')
        else:
            x_values = np.array(data['log2fc'])
            y_values = np.array(data['pvalues'])
            y_transform = 'negative-log10'

        if y_transform == 'negative-log10':
            plotted_y = -np.log10(y_values + 1e-300)
            y_threshold = data.get('yThreshold', 0.05)
            plotted_y_threshold = -np.log10(y_threshold)
        else:
            plotted_y = y_values
            plotted_y_threshold = data.get('yThreshold', None)

        x_threshold = data.get('xThreshold', 1.0)

        plt.figure(figsize=(10, 8))
        
        # Color points based on significance
        if plotted_y_threshold is not None:
            significant_up = (x_values > x_threshold) & (plotted_y > plotted_y_threshold)
            significant_down = (x_values < -x_threshold) & (plotted_y > plotted_y_threshold)
        else:
            significant_up = x_values > x_threshold
            significant_down = x_values < -x_threshold
        not_significant = ~(significant_up | significant_down)
        
        plt.scatter(x_values[not_significant], plotted_y[not_significant], 
                   c='gray', alpha=0.5, label='Not significant')
        plt.scatter(x_values[significant_up], plotted_y[significant_up], 
                   c='red', alpha=0.6, label='Upregulated')
        plt.scatter(x_values[significant_down], plotted_y[significant_down], 
                   c='blue', alpha=0.6, label='Downregulated')
        
        # Add threshold lines
        if plotted_y_threshold is not None:
            plt.axhline(y=plotted_y_threshold, color='black', linestyle='--', linewidth=0.8)
        plt.axvline(x=x_threshold, color='black', linestyle='--', linewidth=0.8)
        plt.axvline(x=-x_threshold, color='black', linestyle='--', linewidth=0.8)
        
        plt.xlabel(data.get('xAxisLabel', 'X Axis'))
        plt.ylabel(data.get('yAxisLabel', 'Y Axis'))
        plt.title(data.get('title', 'Volcano Plot'))
        plt.legend()
        plt.tight_layout()

        if preview:
            plt.show()
        else:
            buf = BytesIO()
            plt.savefig(buf, format='png')
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)
