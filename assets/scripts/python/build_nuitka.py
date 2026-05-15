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

INCLUDE_PACKAGES = [
    "numpy",
    "matplotlib",
    "pandas",
    "scipy",
    "sklearn",
    "seaborn",
]

INCLUDE_PACKAGE_DATA = [
    "matplotlib",
    "pandas",
    "scipy",
    "sklearn",
    "seaborn",
]

INCLUDE_MODULES = [
    "matplotlib.backends.backend_agg",
    "pandas._libs._cyutility",
]

NOFOLLOW_IMPORTS = [
    "*.tests",
    "test",
    "tests",
    "unittest",
    "doctest",
    "setuptools",
    "IPython",
    "PIL.ImageQt",
]


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


def build_args(mode: str) -> list[str]:
    if mode not in {"onefile", "standalone"}:
        raise ValueError(f"Unsupported build mode: {mode}")

    args = [
        sys.executable,
        "-m",
        "nuitka",
        f"--mode={mode}",
        "--static-libpython=no",
        "--disable-ccache",
        "--assume-yes-for-downloads",
        f"--output-dir={OUTPUT_DIR}",
        "--output-filename=commander",
    ]

    for package in INCLUDE_PACKAGES:
        args.append(f"--include-package={package}")

    for package in INCLUDE_PACKAGE_DATA:
        args.append(f"--include-package-data={package}")

    for module in INCLUDE_MODULES:
        args.append(f"--include-module={module}")

    for target in NOFOLLOW_IMPORTS:
        args.append(f"--nofollow-import-to={target}")

    args.append(str(COMMANDER))
    return args


def main() -> int:
    mode = sys.argv[1] if len(sys.argv) > 1 else "onefile"
    command = build_args(mode)
    env = get_env()
    print("Running Nuitka build:")
    print(" ".join(command))
    completed = subprocess.run(command, cwd=ROOT, env=env)
    return completed.returncode


if __name__ == "__main__":
    raise SystemExit(main())
