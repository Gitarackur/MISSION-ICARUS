import matplotlib.pyplot as plt
import base64
from io import BytesIO
from core.Command import Command
from commands.utils import (
    apply_axis_tick_settings,
    apply_grid_settings,
    get_display_settings,
    load_payload,
    to_numeric_list,
)



class ScatterPlotCommand(Command):
    def execute(self):
        preview = "--preview" in self.args
        use_json = "--use-json" in self.args
        input_arg = self.args[0]
        data = load_payload(input_arg, use_json)

        series = data.get('series', [])
        if not series and 'x' in data and 'y' in data:
            series = [{
                'name': data.get('title', 'Series'),
                'x': data.get('x', []),
                'y': data.get('y', []),
                'labels': data.get('labels', [])
            }]

        settings = get_display_settings(data)
        dpi = 100
        figure, axis = plt.subplots(
            figsize=(settings['width'] / dpi, settings['height'] / dpi),
            dpi=dpi,
        )
        rendered_series = 0
        for index, entry in enumerate(series):
            x = to_numeric_list(entry.get('x', []))
            y = to_numeric_list(entry.get('y', []), len(x))
            label = entry.get('name', 'Series')
            if not x or not y:
                continue
            rendered_series += 1
            axis.scatter(
                x,
                y,
                label=label,
                alpha=0.65,
                s=settings['point_size'] ** 2,
                color=settings['colors'][index % len(settings['colors'])],
                edgecolors='none',
            )

        if rendered_series > 1:
            axis.legend(
                ncols=min(3, rendered_series),
                fontsize=settings['tick_font_size'],
                frameon=False,
            )

        axis.set_xlabel(
            settings['x_axis_label'] or data.get('xAxisLabel', 'X'),
            fontsize=settings['axis_label_font_size'],
            loc='center',
        )
        axis.set_ylabel(
            settings['y_axis_label'] or data.get('yAxisLabel', 'Y'),
            fontsize=settings['axis_label_font_size'],
            loc='center',
        )
        axis.set_title(data.get('title', 'Scatter Plot'), pad=12)
        axis.tick_params(axis='both', labelsize=settings['tick_font_size'])
        apply_grid_settings(axis, settings)
        apply_axis_tick_settings(axis, settings, numeric_x=True, numeric_y=True)
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
