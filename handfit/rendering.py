import math
import cv2
import numpy as np


def overlay_rgba(background, overlay, x, y):
    overlay_height, overlay_width = overlay.shape[:2]
    background_height, background_width = background.shape[:2]

    if x >= background_width or y >= background_height:
        return background

    x1 = max(x, 0)
    y1 = max(y, 0)
    x2 = min(x + overlay_width, background_width)
    y2 = min(y + overlay_height, background_height)

    overlay_x1 = x1 - x
    overlay_y1 = y1 - y
    overlay_x2 = overlay_x1 + (x2 - x1)
    overlay_y2 = overlay_y1 + (y2 - y1)

    roi = background[y1:y2, x1:x2]
    overlay_roi = overlay[overlay_y1:overlay_y2, overlay_x1:overlay_x2]

    alpha = overlay_roi[..., 3:4] / 255.0
    roi[:] = (alpha * overlay_roi[..., :3] + (1 - alpha) * roi).astype(np.uint8)
    return background

def compose_outfit(body_image, bg_image, layers, width=600, height=800, bg_color=(255, 214, 252), scale=0.7, bg_scale=1.0):
    if body_image is None and bg_image is None:
        return np.ones((height, width, 3), dtype=np.uint8) * np.array(bg_color, dtype=np.uint8)

    canvas = np.zeros((height, width, 3), dtype=np.uint8)
    if bg_image is not None:
        bg_height, bg_width = bg_image.shape[:2]
        bg_scale = min(width / bg_width, height / bg_height) * bg_scale
        new_bg_width = int(bg_width * bg_scale)
        new_bg_height = int(bg_height * bg_scale)
        resized_bg = cv2.resize(bg_image, (new_bg_width, new_bg_height))
        canvas = overlay_rgba(canvas, resized_bg, (width - new_bg_width) // 2, (height - new_bg_height) // 2)

    body_height, body_width = body_image.shape[:2]
    new_width = int(width * scale)
    new_height = int(body_height * (new_width / body_width))

    if new_height > int(height * 0.9):
        new_height = int(height * 0.9)
        new_width = int(body_width * (new_height / body_height))

    center_x = width // 2
    center_y = height // 2
    x = int(center_x - new_width // 2)
    y = int(center_y - new_height // 2)

    resized_body = cv2.resize(body_image, (new_width, new_height))
    canvas = overlay_rgba(canvas, resized_body, x, y)

    for layer_image in layers:
        if layer_image is None:
            continue
        resized_layer = cv2.resize(layer_image, (new_width, new_height))
        canvas = overlay_rgba(canvas, resized_layer, x, y)

    return canvas
