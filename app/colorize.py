from pathlib import Path
import cv2
import numpy as np

# Local paths (models will be stored here, ignored by git)
MODELS_DIR = Path(__file__).resolve().parent.parent / "models" / "colorization"

PROTO_PATH = MODELS_DIR / "colorization_deploy_v2.prototxt"
MODEL_PATH = MODELS_DIR / "colorization_release_v2.caffemodel"
PTS_PATH = MODELS_DIR / "pts_in_hull.npy"


def colorize_image(input_path: Path, output_path: Path) -> Path:
    """
    Colorizes a grayscale / dull image using OpenCV DNN (Zhang colorization model).
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

    net = cv2.dnn.readNetFromCaffe(str(PROTO_PATH), str(MODEL_PATH))
    pts = np.load(str(PTS_PATH))

    # Add cluster centers as 1x1 convolution kernel to the model
    class8_ab = net.getLayerId("class8_ab")
    conv8_313_rh = net.getLayerId("conv8_313_rh")
    pts = pts.transpose().reshape(2, 313, 1, 1)

    net.getLayer(class8_ab).blobs = [pts.astype("float32")]
    net.getLayer(conv8_313_rh).blobs = [np.full([1, 313], 2.606, dtype="float32")]

    img_bgr = cv2.imread(str(input_path))
    if img_bgr is None:
        raise ValueError("Invalid image file.")

    img_bgr = img_bgr.astype("float32") / 255.0
    img_lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)

    L = img_lab[:, :, 0]  # L channel
    L_resized = cv2.resize(L, (224, 224))
    L_resized -= 50  # Mean-centering

    net.setInput(cv2.dnn.blobFromImage(L_resized))
    ab = net.forward()[0, :, :, :].transpose((1, 2, 0))
    ab = cv2.resize(ab, (img_bgr.shape[1], img_bgr.shape[0]))

    # Combine original L with predicted ab
    colorized_lab = np.concatenate((L[:, :, np.newaxis], ab), axis=2)
    colorized_bgr = cv2.cvtColor(colorized_lab, cv2.COLOR_LAB2BGR)

    colorized_bgr = np.clip(colorized_bgr, 0, 1)
    colorized_bgr = (255 * colorized_bgr).astype("uint8")

    cv2.imwrite(str(output_path), colorized_bgr)
    return output_path