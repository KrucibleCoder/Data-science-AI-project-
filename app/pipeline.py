from pathlib import Path
from app.enhance import enhance_variants
from app.colorize import colorize_image


def process_image(input_path: Path, output_dir: Path, mode: str) -> list[Path]:
    mode = mode.lower().strip()

    if mode == "enhance":
        return enhance_variants(input_path, output_dir)

    if mode == "colorize":
        # Return 3 colorized variants by saving 3 files (same output, different naming)
        out1 = output_dir / f"{input_path.stem}_colorize1.jpg"
        out2 = output_dir / f"{input_path.stem}_colorize2.jpg"
        out3 = output_dir / f"{input_path.stem}_colorize3.jpg"

        # We can simulate variety later; for now generate once and copy it
        colorize_image(input_path, out1)
        out2.write_bytes(out1.read_bytes())
        out3.write_bytes(out1.read_bytes())

        return [out1, out2, out3]

    if mode == "both":
        # Enhance first (pick the best enhanced variant), then colorize it
        enhanced = enhance_variants(input_path, output_dir)[0]
        out1 = output_dir / f"{input_path.stem}_both1.jpg"
        out2 = output_dir / f"{input_path.stem}_both2.jpg"
        out3 = output_dir / f"{input_path.stem}_both3.jpg"

        colorize_image(enhanced, out1)
        out2.write_bytes(out1.read_bytes())
        out3.write_bytes(out1.read_bytes())

        return [out1, out2, out3]

    raise ValueError("Invalid mode. Use enhance, colorize, or both.")
