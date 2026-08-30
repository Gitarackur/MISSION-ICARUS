# Agent UI Rules

- Use `rounded-sm` as the default border radius for app UI surfaces and controls.
- Keep dropdown triggers visually even: default to `min-h-9`, `px-3`, `py-1.5`, `text-sm`, and `rounded-sm`.
- Keep dropdown menus compact and consistent: use `rounded-sm`, a clear border, `p-1`, `shadow-lg`, and options with `min-h-9`, `px-3`, `py-2`, `text-sm`.
- Avoid introducing `rounded-md`, `rounded-lg`, `rounded-xl`, or larger radii in new UI unless the element has a specific shape need, such as an avatar, circular icon, or existing design-system exception.
- In light mode, controls on white or near-white surfaces should have visible borders so buttons and dropdowns do not blend into the background.
