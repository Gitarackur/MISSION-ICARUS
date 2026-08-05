import json
import math
from matplotlib.ticker import MaxNLocator


DEFAULT_PLOT_COLORS = [
    '#2563eb',
    '#7c3aed',
    '#db2777',
    '#059669',
    '#ea580c',
    '#0891b2',
]


def _bounded_number(value, default, minimum, maximum):
    try:
        return min(maximum, max(minimum, float(value)))
    except (TypeError, ValueError):
        return default


def get_display_settings(data):
    raw = data.get('displaySettings') or {}
    colors = raw.get('plotColors') or DEFAULT_PLOT_COLORS
    colors = [str(color) for color in colors if isinstance(color, str) and color]

    return {
        'width': int(_bounded_number(raw.get('plotWidth'), 1000, 640, 2400)),
        'height': int(_bounded_number(raw.get('plotHeight'), 800, 400, 1800)),
        'max_x_ticks': int(_bounded_number(raw.get('maxXTicks'), 12, 2, 30)),
        'max_y_ticks': int(_bounded_number(raw.get('maxYTicks'), 8, 2, 20)),
        'x_label_length': int(_bounded_number(raw.get('xMaxLabelLength'), 16, 4, 60)),
        'y_label_length': int(_bounded_number(raw.get('yMaxLabelLength'), 12, 4, 40)),
        'auto_rotate_x_labels': bool(raw.get('autoRotateXLabels', True)),
        'x_tick_angle': _bounded_number(raw.get('xTickAngle'), 0, -90, 90),
        'y_tick_angle': _bounded_number(raw.get('yTickAngle'), 0, -90, 90),
        'tick_font_size': _bounded_number(raw.get('tickFontSize'), 10, 6, 24),
        'axis_label_font_size': _bounded_number(raw.get('axisLabelFontSize'), 12, 8, 32),
        'point_size': _bounded_number(raw.get('pointSize'), 4, 1, 16),
        'show_grid': bool(raw.get('showGrid', True)),
        'colors': colors or DEFAULT_PLOT_COLORS,
        'x_axis_label': raw.get('xAxisLabel'),
        'y_axis_label': raw.get('yAxisLabel'),
    }


def _set_x_tick_angle(labels, angle):
    for label in labels:
        label.set_rotation(angle)
        label.set_horizontalalignment('right' if angle else 'center')
        label.set_verticalalignment('top')
        label.set_rotation_mode('anchor')


def _x_tick_labels_overlap(axis, labels):
    axis.figure.canvas.draw()
    renderer = axis.figure.canvas.get_renderer()
    visible_labels = [
        label for label in labels if label.get_visible() and label.get_text()
    ]
    bounds = [label.get_window_extent(renderer=renderer) for label in visible_labels]
    return any(
        current.x1 + 4 > following.x0
        for current, following in zip(bounds, bounds[1:])
    )


def apply_axis_tick_settings(axis, settings, numeric_x=False, numeric_y=False):
    if numeric_x:
        axis.xaxis.set_major_locator(MaxNLocator(nbins=settings['max_x_ticks']))
    if numeric_y:
        axis.yaxis.set_major_locator(MaxNLocator(nbins=settings['max_y_ticks']))

    x_labels = axis.get_xticklabels()
    if settings['auto_rotate_x_labels']:
        for angle in (0, 30, 45, 60):
            _set_x_tick_angle(x_labels, angle)
            if not _x_tick_labels_overlap(axis, x_labels):
                break
    else:
        _set_x_tick_angle(x_labels, settings['x_tick_angle'])

    axis.tick_params(axis='x', pad=6)

    for label in axis.get_yticklabels():
        label.set_rotation(settings['y_tick_angle'])
        label.set_horizontalalignment('right')
        label.set_verticalalignment('center')
        label.set_rotation_mode('anchor')


def apply_grid_settings(axis, settings, axis_name='both'):
    if settings['show_grid']:
        axis.grid(True, axis=axis_name, alpha=0.22, linewidth=0.8)
    else:
        axis.grid(False)


def truncate_label(value, max_length):
    label = str(value)
    if len(label) <= max_length:
        return label
    return f"{label[:max(3, max_length - 1)]}…"


def sample_axis_labels(labels, max_ticks, max_length):
    count = len(labels)
    if count == 0:
        return [], []

    interval = max(1, math.ceil(count / max(1, max_ticks)))
    positions = list(range(0, count, interval))
    if positions[-1] != count - 1:
        positions.append(count - 1)

    return positions, [truncate_label(labels[index], max_length) for index in positions]


def load_payload(input_arg, use_json=False):
    if use_json:
        return json.loads(input_arg)

    try:
        with open(input_arg) as file_handle:
            return json.load(file_handle)
    except (FileNotFoundError, OSError):
        return json.loads(input_arg)


def to_numeric_list(values, target_length=None, default=0.0):
    normalized = []

    for value in values or []:
        if isinstance(value, (list, tuple)):
            value = value[0] if value else default

        try:
            numeric_value = float(value)
        except (TypeError, ValueError):
            numeric_value = default

        normalized.append(numeric_value)

    if target_length is None:
        return normalized

    if len(normalized) < target_length:
        normalized.extend([default] * (target_length - len(normalized)))

    return normalized[:target_length]


def normalize_categories(categories):
    return [str(category) for category in (categories or [])]
