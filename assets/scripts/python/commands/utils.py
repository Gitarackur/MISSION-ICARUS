import json
import math


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
        'x_tick_angle': _bounded_number(raw.get('xTickAngle'), -35, -90, 90),
        'tick_font_size': _bounded_number(raw.get('tickFontSize'), 10, 6, 24),
        'axis_label_font_size': _bounded_number(raw.get('axisLabelFontSize'), 12, 8, 32),
        'point_size': _bounded_number(raw.get('pointSize'), 4, 1, 16),
        'show_grid': bool(raw.get('showGrid', True)),
        'colors': colors or DEFAULT_PLOT_COLORS,
        'x_axis_label': raw.get('xAxisLabel'),
        'y_axis_label': raw.get('yAxisLabel'),
    }


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
