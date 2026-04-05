model_path = './gesture_recognizer.task'

import cv2
import math
import threading
import time
import os
import glob

import mediapipe as mp
import numpy as np

BaseOptions = mp.tasks.BaseOptions
GestureRecognizer = mp.tasks.vision.GestureRecognizer
GestureRecognizerOptions = mp.tasks.vision.GestureRecognizerOptions
GestureRecognizerResult = mp.tasks.vision.GestureRecognizerResult
VisionRunningMode = mp.tasks.vision.RunningMode

WHEEL_SIZE = 260
WHEEL_RADIUS = WHEEL_SIZE // 2
WHEEL_MARGIN = 20

latest_result = None
result_lock = threading.Lock()
live_color_bgr = (0, 255, 0)
selected_color_bgr = (0, 255, 0)
live_hue_degrees = 0.0
live_saturation = 255

# Body selection variables
body_images = []
current_body_index = 0
body_lock = threading.Lock()
last_swipe_time = 0
SWIPE_COOLDOWN = 0.5  # Seconds between swipes
game_state = {
    'current_body_index': 0,
    'last_swipe_time': 0
}


def create_color_wheel(diameter):
    radius = diameter // 2
    y, x = np.ogrid[-radius:radius, -radius:radius]
    distance = np.sqrt(x * x + y * y)
    angle = (np.degrees(np.arctan2(-y, x)) + 360) % 360

    hsv = np.zeros((diameter, diameter, 3), dtype=np.uint8)
    hsv[..., 0] = (angle / 2).astype(np.uint8)
    hsv[..., 1] = np.clip((distance / radius) * 255, 0, 255).astype(np.uint8)
    hsv[..., 2] = 255

    wheel = cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)
    mask = distance <= radius

    wheel_rgba = np.zeros((diameter, diameter, 4), dtype=np.uint8)
    wheel_rgba[..., :3] = wheel
    wheel_rgba[..., 3] = mask.astype(np.uint8) * 255
    return wheel_rgba


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


def distance(point_a, point_b):
    return math.hypot(point_a.x - point_b.x, point_a.y - point_b.y)


def angle_from_wrist_to_index_mcp(hand_landmarks):
    wrist = hand_landmarks[0]
    index_mcp = hand_landmarks[5]
    delta_x = index_mcp.x - wrist.x
    delta_y = wrist.y - index_mcp.y
    return math.degrees(math.atan2(delta_y, delta_x)) % 360


def hue_to_bgr(hue_degrees, saturation=255, value=255):
    hsv = np.uint8([[[int(hue_degrees / 2), int(np.clip(saturation, 0, 255)), int(np.clip(value, 0, 255))]]])
    return tuple(int(channel) for channel in cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)[0, 0])


def hand_openness(hand_landmarks):
    wrist = hand_landmarks[0]
    finger_tips = [4, 8, 12, 16, 20]
    palm_size = max(distance(wrist, hand_landmarks[9]), 1e-6)
    average_tip_distance = sum(distance(wrist, hand_landmarks[index]) for index in finger_tips) / len(finger_tips)
    return average_tip_distance / palm_size

def swipe(hand_landmarks):
    # Detect a quick horizontal swipe by comparing the x-coordinates of the wrist and index finger tip.
    wrist = hand_landmarks[0]
    index_tip = hand_landmarks[8]
    delta_x = index_tip.x - wrist.x
    
    if abs(delta_x) > 0.3:  # Adjust threshold as needed
        return "right" if delta_x > 0 else "left"
    return None


def openness_to_saturation(openness):
    # Open hand = saturated color, closed hand = muted color.
    return int(np.clip(np.interp(openness, [0.45, 1.45], [40, 255]), 40, 255))


def draw_knob_ui(frame, center_x, center_y, hue_degrees, saturation, current_color_bgr):
    overlay = frame.copy()

    cv2.circle(overlay, (center_x, center_y), WHEEL_RADIUS, (30, 30, 30), -1)
    cv2.circle(overlay, (center_x, center_y), WHEEL_RADIUS, (255, 255, 255), 2)

    inner_radius = int(WHEEL_RADIUS * 0.68)
    cv2.circle(overlay, (center_x, center_y), inner_radius, (45, 45, 45), -1)

    pointer_radius = WHEEL_RADIUS - 18
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


def load_body_images():
    """Load all body images from the body folder."""
    body_folder = './body'
    image_files = sorted(glob.glob(os.path.join(body_folder, '*.png')))
    
    images = []
    for img_path in image_files:
        img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
        if img is not None:
            images.append(img)
    
    return images


def overlay_body_image(frame, body_image, center_x, center_y, scale=0.6):
    """Overlay a body image at the center of the frame."""
    if body_image is None:
        return frame
    
    # Resize the body image based on scale
    height, width = body_image.shape[:2]
    new_width = int(frame.shape[1] * scale)
    new_height = int(height * (new_width / width))
    resized_body = cv2.resize(body_image, (new_width, new_height))
    
    # Calculate position to center the image
    x = int(center_x - new_width // 2)
    y = int(center_y - new_height // 2)
    
    # Use overlay_rgba to handle transparency
    frame = overlay_rgba(frame, resized_body, x, y)
    return frame


# Create a gesture recognizer instance with the live stream mode:
def print_result(result, output_image, timestamp_ms):
    global latest_result
    with result_lock:
        latest_result = result


options = GestureRecognizerOptions(
    base_options=BaseOptions(model_asset_path=model_path),
    running_mode=VisionRunningMode.LIVE_STREAM,
    result_callback=print_result,
)

# Load body images
body_images = load_body_images()
if not body_images:
    print("No body images found in ./body folder")
else:
    print(f"Loaded {len(body_images)} body images")

with GestureRecognizer.create_from_options(options) as recognizer:
    cap = cv2.VideoCapture(0)
    last_timestamp_ms = 0

    try:
        cv2.namedWindow('Camera', cv2.WINDOW_NORMAL)
        while cap.isOpened():
            ret, frame = cap.read()

            if not ret:
                continue

            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            frame_timestamp_ms = max(last_timestamp_ms + 1, time.monotonic_ns() // 1_000_000)
            last_timestamp_ms = frame_timestamp_ms
            recognizer.recognize_async(mp_image, frame_timestamp_ms)

            display_frame = frame.copy()
            wheel_center_x = display_frame.shape[1] - WHEEL_MARGIN - WHEEL_RADIUS
            wheel_center_y = WHEEL_MARGIN + WHEEL_RADIUS
            
            # Center of the frame for body display
            body_center_x = display_frame.shape[1] // 2
            body_center_y = display_frame.shape[0] // 2

            with result_lock:
                current_result = latest_result

            if current_result and current_result.hand_landmarks and current_result.handedness:
                for hand_index, hand_landmarks in enumerate(current_result.hand_landmarks):
                    hand_label = current_result.handedness[hand_index][0].category_name
                    if hand_label == 'Left':
                        # Check for swipe to change body
                        swipe_direction = swipe(hand_landmarks)
                        if swipe_direction is not None:
                            current_time = time.time()
                            if current_time - game_state['last_swipe_time'] > SWIPE_COOLDOWN:
                                with body_lock:
                                    if swipe_direction == "right":
                                        game_state['current_body_index'] = (game_state['current_body_index'] + 1) % len(body_images)
                                    elif swipe_direction == "left":
                                        game_state['current_body_index'] = (game_state['current_body_index'] - 1) % len(body_images)
                                game_state['last_swipe_time'] = current_time
                        
                        # Update color knob based on openness
                        live_hue_degrees = angle_from_wrist_to_index_mcp(hand_landmarks)
                        live_saturation = openness_to_saturation(hand_openness(hand_landmarks))
                        live_color_bgr = hue_to_bgr(live_hue_degrees, live_saturation)
                        selected_color_bgr = live_color_bgr

            # Flip the frame for mirror effect
            display_frame = cv2.flip(display_frame, 1)
            
            # Draw the body image in the center
            if body_images:
                with body_lock:
                    current_body = body_images[game_state['current_body_index']]
                display_frame = overlay_body_image(display_frame, current_body, body_center_x, body_center_y)
            
            # Draw the color knob UI
            draw_knob_ui(display_frame, wheel_center_x, wheel_center_y, live_hue_degrees, live_saturation, selected_color_bgr)
            
            cv2.imshow('Camera', display_frame)
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
    finally:
        cap.release()
        cv2.destroyAllWindows()
    

