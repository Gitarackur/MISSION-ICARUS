import matplotlib.pyplot as plt
import base64
from io import BytesIO
from core.Command import Command
from commands.utils import (
    apply_axis_tick_settings,
    apply_grid_settings,
    get_display_settings,
    load_payload,
    normalize_categories,
    sample_axis_labels,
    to_numeric_list,
)



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

        settings = get_display_settings(data)
        dpi = 100
        figure, axis = plt.subplots(
            figsize=(settings['width'] / dpi, settings['height'] / dpi),
            dpi=dpi,
        )
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
            axis.bar(
                offsets,
                entry['values'],
                width=width,
                label=entry['name'],
                color=settings['colors'][index % len(settings['colors'])],
                alpha=0.88,
            )

        tick_positions, tick_labels = sample_axis_labels(
            categories,
            settings['max_x_ticks'],
            settings['x_label_length'],
        )
        axis.set_xticks(tick_positions, tick_labels)
        axis.tick_params(axis='both', labelsize=settings['tick_font_size'])
        plt.setp(
            axis.get_xticklabels(),
            rotation=settings['x_tick_angle'],
            ha='right' if settings['x_tick_angle'] else 'center',
            rotation_mode='anchor',
        )
        if len(normalized_series) > 1:
            axis.legend(
                ncols=min(3, len(normalized_series)),
                fontsize=settings['tick_font_size'],
                frameon=False,
            )
        axis.set_xlabel(
            settings['x_axis_label'] or data.get('xAxisLabel', 'X Axis'),
            fontsize=settings['axis_label_font_size'],
            labelpad=10,
            loc='center',
        )
        axis.set_ylabel(
            settings['y_axis_label'] or data.get('yAxisLabel', 'Y Axis'),
            fontsize=settings['axis_label_font_size'],
            labelpad=10,
            loc='center',
        )
        axis.set_title(data.get('title', 'Bar Plot'), pad=12)
        apply_grid_settings(axis, settings, axis_name='y')
        apply_axis_tick_settings(axis, settings, numeric_y=True)
        axis.set_axisbelow(True)
        figure.tight_layout(pad=1.4)

        if preview:
            # Show the chart in a window
            plt.show()
        else:
            buf = BytesIO()
            figure.savefig(buf, format='png', dpi=dpi)
            plt.close(figure)
            buf.seek(0)

            img_base64 = base64.b64encode(buf.read()).decode('utf-8')
            print(img_base64)
