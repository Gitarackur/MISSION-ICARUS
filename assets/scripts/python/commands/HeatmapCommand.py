import matplotlib.pyplot as plt
import seaborn as sns
import numpy as np
import base64
from io import BytesIO
from matplotlib.colors import LinearSegmentedColormap
from core.Command import Command
from commands.utils import (
    get_display_settings,
    load_payload,
    truncate_label,
)



class HeatmapCommand(Command):
    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0]

        data = load_payload(input_arg, use_json)

        # Expected format: {"matrix": [[values]], "row_labels": [...], "col_labels": [...]}
        matrix = np.array(data['matrix'])
        row_labels = data.get('row_labels', None)
        col_labels = data.get('col_labels', None)

        settings = get_display_settings(data)
        dpi = 100
        figure, axis = plt.subplots(
            figsize=(settings['width'] / dpi, settings['height'] / dpi),
            dpi=dpi,
        )
        color_map = LinearSegmentedColormap.from_list(
            'icarus_heatmap',
            [settings['colors'][0], '#f8fafc', settings['colors'][2 % len(settings['colors'])]],
        )
        annotate = matrix.size <= 144
        sns.heatmap(
            matrix,
            annot=annotate,
            fmt='.2f',
            cmap=color_map,
            xticklabels=False,
            yticklabels=False,
            linewidths=0.4 if settings['show_grid'] else 0,
            linecolor='white',
            ax=axis,
        )

        if col_labels:
            x_interval = max(1, int(np.ceil(len(col_labels) / settings['max_x_ticks'])))
            x_positions = list(range(0, len(col_labels), x_interval))
            if x_positions[-1] != len(col_labels) - 1:
                x_positions.append(len(col_labels) - 1)
            axis.set_xticks([position + 0.5 for position in x_positions])
            axis.set_xticklabels([
                truncate_label(col_labels[position], settings['x_label_length'])
                for position in x_positions
            ])

        if row_labels:
            y_interval = max(1, int(np.ceil(len(row_labels) / settings['max_y_ticks'])))
            y_positions = list(range(0, len(row_labels), y_interval))
            if y_positions[-1] != len(row_labels) - 1:
                y_positions.append(len(row_labels) - 1)
            axis.set_yticks([position + 0.5 for position in y_positions])
            axis.set_yticklabels([
                truncate_label(row_labels[position], settings['y_label_length'])
                for position in y_positions
            ])

        plt.setp(
            axis.get_xticklabels(),
            rotation=settings['x_tick_angle'],
            ha='right' if settings['x_tick_angle'] else 'center',
            rotation_mode='anchor',
        )
        axis.set_xlabel(
            settings['x_axis_label'] or data.get('xAxisLabel', 'Columns'),
            fontsize=settings['axis_label_font_size'],
            loc='center',
        )
        axis.set_ylabel(
            settings['y_axis_label'] or data.get('yAxisLabel', 'Rows'),
            fontsize=settings['axis_label_font_size'],
            loc='center',
        )
        axis.set_title(data.get('title', 'Heatmap'), pad=12)
        axis.tick_params(axis='both', labelsize=settings['tick_font_size'])
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
