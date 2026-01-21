from pathlib import Path
import cv2
import numpy as np

# Local paths (models will be stored here, ignored by git)
MODELS_DIR = Path(__file__).resolve().parent.parent / "models" / "colorization"

PROTO_PATH = MODELS_DIR / "colorization_deploy_v2.prototxt"
MODEL_PATH = MODELS_DIR / "colorization_release_v2.caffemodel"
PTS_PATH = MODELS_DIR / "pts_in_hull.npy"


def _apply_saturation_bgr(img_bgr: np.ndarray, saturation: float) -> np.ndarray:
    """
    Adjust saturation in HSV space.
    saturation=1.0 means no change.
    """
    if abs(saturation - 1.0) < 1e-6:
        return img_bgr

    hsv = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2HSV).astype("float32")
    hsv[:, :, 1] *= float(saturation)
    hsv[:, :, 1] = np.clip(hsv[:, :, 1], 0, 255)
    out = cv2.cvtColor(hsv.astype("uint8"), cv2.COLOR_HSV2BGR)
    return out


def colorize_image(
    input_path: Path,
    output_path: Path,
    *,
    blend: float = 0.85,
    saturation: float = 1.0,
    edge_smooth: bool = True,
) -> Path:
    """
    Colorizes an image using OpenCV DNN (Zhang colorization model).

    Upgrades added:
    - blend: Controls strength of predicted colors (lower reduces color bleeding)
    - saturation: Creates different-looking variants (soft/natural/vivid)
    - edge_smooth: Edge-preserving smoothing (bilateral filter) to reduce bleeding

    Requires 3 files in /models/colorization:
      - colorization_deploy_v2.prototxt
      - colorization_release_v2.caffemodel
      - pts_in_hull.npy
    """
    if not (PROTO_PATH.exists() and MODEL_PATH.exists() and PTS_PATH.exists()):
        raise FileNotFoundError(
            "Colorization model files not found in /models/colorization. "
            "Make sure prototxt, caffemodel, pts_in_hull.npy exist in that folder."
        )

    # Clamp blend to safe range
    blend = float(np.clip(blend, 0.0, 1.0))
    saturation = float(max(0.0, saturation))

    net = cv2.dnn.readNetFromCaffe(str(PROTO_PATH), str(MODEL_PATH))
    pts = np.load(str(PTS_PATH))

    # Add cluster centers as 1x1 convolution kernel to the model
    class8_ab = net.getLayerId("class8_ab")
    conv8_313_rh = net.getLayerId("conv8_313_rh")
    pts = pts.transpose().reshape(2, 313, 1, 1)

    net.getLayer(class8_ab).blobs = [pts.astype("float32")]
    net.getLayer(conv8_313_rh).blobs = [np.full([1, 313], 2.606, dtype="float32")]

    img_bgr_u8 = cv2.imread(str(input_path))
    if img_bgr_u8 is None:
        raise ValueError("Invalid image file.")

    # Convert to LAB
    img_bgr = img_bgr_u8.astype("float32") / 255.0
    img_lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)

    # L channel
    L = img_lab[:, :, 0]
    L_resized = cv2.resize(L, (224, 224))
    L_resized -= 50  # Mean-centering

    # Predict ab
    net.setInput(cv2.dnn.blobFromImage(L_resized))
    ab = net.forward()[0, :, :, :].transpose((1, 2, 0))
    ab = cv2.resize(ab, (img_bgr.shape[1], img_bgr.shape[0]))

    # ✅ Upgrade A: Reduce bleeding by blending predicted chroma
    # Lower blend = more conservative colors, less bleeding
    ab = ab * blend

    # ✅ Upgrade B (optional): Smooth ONLY chroma (ab), not luminance
    # This helps stabilize weird chroma blobs.
    # Keeping it light to avoid washing details.
    ab = cv2.GaussianBlur(ab, (0, 0), 1.0)

    # Combine original L with predicted ab
    colorized_lab = np.concatenate((L[:, :, np.newaxis], ab), axis=2)
    colorized_bgr = cv2.cvtColor(colorized_lab, cv2.COLOR_LAB2BGR)

    # Convert back to uint8
    colorized_bgr = np.clip(colorized_bgr, 0, 1)
    colorized_bgr = (255 * colorized_bgr).astype("uint8")

    # ✅ Upgrade C: Adjust saturation to generate real variants
    colorized_bgr = _apply_saturation_bgr(colorized_bgr, saturation)

    # ✅ Upgrade D: Edge-preserving smoothing after colorization
    # Helps reduce color spill across boundaries without destroying edges
    if edge_smooth:
        colorized_bgr = cv2.bilateralFilter(colorized_bgr, d=7, sigmaColor=50, sigmaSpace=50)

    cv2.imwrite(str(output_path), colorized_bgr)
    return output_path