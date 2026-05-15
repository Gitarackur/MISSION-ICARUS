from __future__ import annotations

import os
import subprocess
import sys
from pathlib import Path


ROOT = Path(__file__).resolve().parent
COMMANDER = ROOT / "commander.py"
OUTPUT_DIR = ROOT / "bin"
CACHE_DIR = ROOT / ".nuitka-cache"
MPL_CACHE_DIR = CACHE_DIR / "matplotlib"
FONTCONFIG_CACHE_DIR = CACHE_DIR / "fontconfig"

COMMON_NOFOLLOW = [
    "*.tests",
    "*.testing",
    "test",
    "tests",
    "unittest",
    "doctest",
    "pydoc",
    "setuptools",
    "IPython",
    "PIL.ImageQt",
]

PROFILE_CONFIG = {
    "plot-core": {
        "output_name": "commander-plot-core",
        "packages": ["numpy", "matplotlib"],
        "package_data": ["matplotlib"],
    },
    "plot-heatmap": {
        "output_name": "commander-plot-heatmap",
        "packages": ["numpy", "matplotlib", "pandas", "seaborn"],
        "package_data": ["matplotlib", "seaborn"],
    },
    "plot-ml": {
        "output_name": "commander-plot-ml",
        "packages": ["numpy", "matplotlib", "scipy", "sklearn"],
        "package_data": ["matplotlib", "scipy", "sklearn"],
    },
}


def get_env() -> dict[str, str]:
    CACHE_DIR.mkdir(exist_ok=True)
    MPL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
    FONTCONFIG_CACHE_DIR.mkdir(parents=True, exist_ok=True)

    env = dict(os.environ)
    env["NUITKA_CACHE_DIR"] = str(CACHE_DIR)
    env["MPLCONFIGDIR"] = str(MPL_CACHE_DIR)
    env["XDG_CACHE_HOME"] = str(CACHE_DIR)
    env["FONTCONFIG_PATH"] = str(FONTCONFIG_CACHE_DIR)
    env["MPLBACKEND"] = "Agg"
    return env


def build_args(mode: str, profile: str) -> list[str]:
    if mode not in {"onefile", "standalone"}:
        raise ValueError(f"Unsupported build mode: {mode}")

    if profile not in PROFILE_CONFIG:
        raise ValueError(f"Unsupported build profile: {profile}")

    config = PROFILE_CONFIG[profile]
    args = [
        sys.executable,
        "-m",
        "nuitka",
        f"--mode={mode}",
        "--static-libpython=no",
        "--assume-yes-for-downloads",
        "--output-dir={}".format(OUTPUT_DIR),
        "--output-filename={}".format(config["output_name"]),
        "--include-module=matplotlib.backends.backend_agg",
    ]

    for package in config["packages"]:
        args.append(f"--include-package={package}")

    for package in config["package_data"]:
        args.append(f"--include-package-data={package}")

    for target in COMMON_NOFOLLOW:
        args.append(f"--nofollow-import-to={target}")

    args.append(str(COMMANDER))
    return args


def run_build(mode: str, profile: str) -> int:
    command = build_args(mode, profile)
    env = get_env()
    print(f"Running Nuitka build for profile '{profile}':")
    print(" ".join(command))
    completed = subprocess.run(command, cwd=ROOT, env=env)
    return completed.returncode


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "onefile"
    target = sys.argv[2] if len(sys.argv) > 2 else "all"

    profiles = list(PROFILE_CONFIG.keys()) if target == "all" else [target]

    for profile in profiles:
        exit_code = run_build(mode, profile)
        if exit_code != 0:
            return exit_code

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
