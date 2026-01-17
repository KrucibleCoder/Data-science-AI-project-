from pathlib import Path
from app.enhance import enhance_variants


def process_image(input_path: Path, output_dir: Path, mode: str) -> list[Path]:
    """
    mode = enhance | colorize | both
    For now, only enhance works.
    """
    mode = mode.lower().strip()

    if mode == "enhance":
        return enhance_variants(input_path, output_dir)

    if mode == "colorize":
        # Placeholder for tomorrow: real model inference
        return enhance_variants(input_path, output_dir)

    if mode == "both":
        # Placeholder: enhance then colorize
        return enhance_variants(input_path, output_dir)

    raise ValueError("Invalid mode. Use enhance, colorize, or both.")