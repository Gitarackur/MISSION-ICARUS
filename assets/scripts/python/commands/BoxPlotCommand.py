import matplotlib.pyplot as plt
import base64
from io import BytesIO
from core.Command import Command
from commands.utils import (
    get_display_settings,
    load_payload,
    sample_axis_labels,
    to_numeric_list,
)



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

        settings = get_display_settings(data)
        dpi = 100
        figure, axis = plt.subplots(
            figsize=(settings['width'] / dpi, settings['height'] / dpi),
            dpi=dpi,
        )
        artists = axis.boxplot(values, patch_artist=True)
        for index, box in enumerate(artists['boxes']):
            color = settings['colors'][index % len(settings['colors'])]
            box.set_facecolor(color)
            box.set_edgecolor(color)
            box.set_alpha(0.25)

        tick_positions, tick_labels = sample_axis_labels(
            labels,
            settings['max_x_ticks'],
            settings['x_label_length'],
        )
        axis.set_xticks([position + 1 for position in tick_positions], tick_labels)
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
            settings['y_axis_label'] or data.get('yAxisLabel', 'Values'),
            fontsize=settings['axis_label_font_size'],
            loc='center',
        )
        axis.set_title(data.get('title', 'Box Plot'), pad=12)
        axis.tick_params(axis='both', labelsize=settings['tick_font_size'])
        axis.grid(settings['show_grid'], axis='y', alpha=0.22, linewidth=0.8)
        axis.set_axisbelow(True)
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
