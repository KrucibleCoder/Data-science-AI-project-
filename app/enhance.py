from pathlib import Path
import cv2


def enhance_variants(input_path: Path, output_dir: Path) -> list[Path]:
    """
    Generates 3 enhancement variants:
    1) Denoise + mild contrast
    2) CLAHE contrast enhancement
    3) Sharpen (unsharp mask) + slight warm tone
    """
    img = cv2.imread(str(input_path))
    if img is None:
        raise ValueError("Failed to read image.")

    variants = []

    # Variant 1: Denoise + mild contrast
    denoised = cv2.fastNlMeansDenoisingColored(img, None, 7, 7, 7, 21)
    mild = cv2.convertScaleAbs(denoised, alpha=1.15, beta=5)
    out1 = output_dir / f"{input_path.stem}_enhance1_denoise.jpg"
    cv2.imwrite(str(out1), mild)
    variants.append(out1)

    # Variant 2: CLAHE on L channel (better local contrast)
    lab = cv2.cvtColor(img, cv2.COLOR_BGR2LAB)
    l, a, b = cv2.split(lab)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    l2 = clahe.apply(l)
    lab2 = cv2.merge((l2, a, b))
    clahe_img = cv2.cvtColor(lab2, cv2.COLOR_LAB2BGR)
    out2 = output_dir / f"{input_path.stem}_enhance2_clahe.jpg"
    cv2.imwrite(str(out2), clahe_img)
    variants.append(out2)

    # Variant 3: Unsharp mask + warm tone
    blur = cv2.GaussianBlur(img, (0, 0), 2)
    sharp = cv2.addWeighted(img, 1.5, blur, -0.5, 0)

    warm = sharp.copy()
    warm[:, :, 2] = cv2.add(warm[:, :, 2], 15)  # add red slightly
    out3 = output_dir / f"{input_path.stem}_enhance3_sharp_warm.jpg"
    cv2.imwrite(str(out3), warm)
    variants.append(out3)

    return variants