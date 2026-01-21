from pathlib import Path
from app.enhance import enhance_variants
from app.colorize import colorize_image


def process_image(input_path: Path, output_dir: Path, mode: str) -> list[Path]:
    mode = mode.lower().strip()

    if mode == "enhance":
        return enhance_variants(input_path, output_dir)

    if mode == "colorize":
        out1 = output_dir / f"{input_path.stem}_colorize1_natural.jpg"
        out2 = output_dir / f"{input_path.stem}_colorize2_soft.jpg"
        out3 = output_dir / f"{input_path.stem}_colorize3_vivid.jpg"

        colorize_image(input_path, out1, blend=0.85, saturation=1.00, edge_smooth=True)
        colorize_image(input_path, out2, blend=0.65, saturation=0.90, edge_smooth=True)
        colorize_image(input_path, out3, blend=0.92, saturation=1.25, edge_smooth=True)

        return [out1, out2, out3]

    if mode == "both":
        # Enhance first (pick the best enhanced variant), then colorize it into 3 styles
        enhanced = enhance_variants(input_path, output_dir)[0]

        out1 = output_dir / f"{input_path.stem}_both1_natural.jpg"
        out2 = output_dir / f"{input_path.stem}_both2_soft.jpg"
        out3 = output_dir / f"{input_path.stem}_both3_vivid.jpg"

        colorize_image(enhanced, out1, blend=0.85, saturation=1.00, edge_smooth=True)
        colorize_image(enhanced, out2, blend=0.65, saturation=0.90, edge_smooth=True)
        colorize_image(enhanced, out3, blend=0.92, saturation=1.25, edge_smooth=True)

        return [out1, out2, out3]

    raise ValueError("Invalid mode. Use enhance, colorize, or both.")
