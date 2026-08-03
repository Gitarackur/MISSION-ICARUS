import matplotlib.pyplot as plt
import numpy as np
import base64
from io import BytesIO
from core.Command import Command
from commands.utils import get_display_settings, load_payload



class VolcanoPlotCommand(Command):
    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0]

        data = load_payload(input_arg, use_json)

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

        settings = get_display_settings(data)
        dpi = 100
        figure, axis = plt.subplots(
            figsize=(settings['width'] / dpi, settings['height'] / dpi),
            dpi=dpi,
        )
        
        # Color points based on significance
        if plotted_y_threshold is not None:
            significant_up = (x_values > x_threshold) & (plotted_y > plotted_y_threshold)
            significant_down = (x_values < -x_threshold) & (plotted_y > plotted_y_threshold)
        else:
            significant_up = x_values > x_threshold
            significant_down = x_values < -x_threshold
        not_significant = ~(significant_up | significant_down)
        
        marker_size = settings['point_size'] ** 2
        axis.scatter(x_values[not_significant], plotted_y[not_significant],
                     c=settings['colors'][4 % len(settings['colors'])], s=marker_size,
                     alpha=0.5, label='Not significant', edgecolors='none')
        axis.scatter(x_values[significant_up], plotted_y[significant_up],
                     c=settings['colors'][2 % len(settings['colors'])], s=marker_size,
                     alpha=0.65, label='Upregulated', edgecolors='none')
        axis.scatter(x_values[significant_down], plotted_y[significant_down],
                     c=settings['colors'][0], s=marker_size,
                     alpha=0.65, label='Downregulated', edgecolors='none')
        
        # Add threshold lines
        if plotted_y_threshold is not None:
            axis.axhline(y=plotted_y_threshold, color='black', linestyle='--', linewidth=0.8)
        axis.axvline(x=x_threshold, color='black', linestyle='--', linewidth=0.8)
        axis.axvline(x=-x_threshold, color='black', linestyle='--', linewidth=0.8)
        
        axis.set_xlabel(
            settings['x_axis_label'] or data.get('xAxisLabel', 'X Axis'),
            fontsize=settings['axis_label_font_size'],
            loc='center',
        )
        axis.set_ylabel(
            settings['y_axis_label'] or data.get('yAxisLabel', 'Y Axis'),
            fontsize=settings['axis_label_font_size'],
            loc='center',
        )
        axis.set_title(data.get('title', 'Volcano Plot'), pad=12)
        axis.tick_params(axis='both', labelsize=settings['tick_font_size'])
        axis.grid(settings['show_grid'], alpha=0.22, linewidth=0.8)
        axis.set_axisbelow(True)
        axis.legend(fontsize=settings['tick_font_size'], frameon=False)
        figure.tight_layout(pad=1.4)

        if preview:
            plt.show()
        else:
            buf = BytesIO()
            figure.savefig(buf, format='png', dpi=dpi)
            plt.close(figure)
            buf.seek(0)
            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)
