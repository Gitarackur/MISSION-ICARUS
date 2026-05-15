import json


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
