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


def draw_knob_ui(frame, center_x, center_y, hue_degrees, saturation, current_color_bgr):
    overlay = frame.copy()

    cv2.circle(overlay, (center_x, center_y), 130, (30, 30, 30), -1)
    cv2.circle(overlay, (center_x, center_y), 130, (255, 255, 255), 2)

    inner_radius = int(130 * 0.68)
    cv2.circle(overlay, (center_x, center_y), inner_radius, (45, 45, 45), -1)

    pointer_radius = 130 - 18
    pointer_x = int(center_x + math.cos(math.radians(hue_degrees)) * pointer_radius)
    pointer_y = int(center_y - math.sin(math.radians(hue_degrees)) * pointer_radius)
    cv2.line(overlay, (center_x, center_y), (pointer_x, pointer_y), current_color_bgr, 10)
    cv2.circle(overlay, (pointer_x, pointer_y), 14, (255, 255, 255), 2)
    cv2.circle(overlay, (pointer_x, pointer_y), 8, current_color_bgr, -1)

    cv2.circle(overlay, (center_x, center_y), 20, current_color_bgr, -1)
    cv2.circle(overlay, (center_x, center_y), 20, (255, 255, 255), 2)

    alpha = 0.75
    cv2.addWeighted(overlay, alpha, frame, 1 - alpha, 0, frame)

    preview_x1, preview_y1 = 20, 20
    preview_x2, preview_y2 = 180, 90
    cv2.rectangle(frame, (preview_x1, preview_y1), (preview_x2, preview_y2), current_color_bgr, -1)
    cv2.rectangle(frame, (preview_x1, preview_y1), (preview_x2, preview_y2), (255, 255, 255), 2)
    cv2.putText(frame, 'Color actual', (20, 115), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (255, 255, 255), 2, cv2.LINE_AA)

    saturation_width = 180
    saturation_height = 18
    bar_x1, bar_y1 = 20, 135
    bar_x2, bar_y2 = bar_x1 + saturation_width, bar_y1 + saturation_height
    cv2.rectangle(frame, (bar_x1, bar_y1), (bar_x2, bar_y2), (60, 60, 60), -1)
    fill_width = int(saturation_width * (saturation / 255.0))
    cv2.rectangle(frame, (bar_x1, bar_y1), (bar_x1 + fill_width, bar_y2), current_color_bgr, -1)
    cv2.rectangle(frame, (bar_x1, bar_y1), (bar_x2, bar_y2), (255, 255, 255), 1)
    cv2.putText(frame, 'Saturacion', (20, 175), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (255, 255, 255), 2, cv2.LINE_AA)

    cv2.putText(frame, 'Mano izquierda abierta: gira la perilla', (20, 210), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)
    cv2.putText(frame, 'Mano mas cerrada: cambia saturacion', (20, 235), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (255, 255, 255), 2, cv2.LINE_AA)


def compose_outfit(body_image, layers, width=600, height=800, bg_color=(255, 255, 255), scale=0.7):
    if body_image is None:
        return np.ones((height, width, 3), dtype=np.uint8) * np.array(bg_color, dtype=np.uint8)

    canvas = np.ones((height, width, 3), dtype=np.uint8) * np.array(bg_color, dtype=np.uint8)

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
