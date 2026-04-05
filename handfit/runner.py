import time
import threading

import cv2
import mediapipe as mp

from .assets import AssetLibrary
from .config import MODEL_PATH, PART_ORDER, SWIPE_COOLDOWN
from .mediapipe_helpers import angle_from_wrist_to_index_mcp, hand_openness, hue_to_bgr
from .rendering import compose_outfit, draw_knob_ui
from .state import OutfitState
from .swipe import detect_swipe

latest_result = None
result_lock = threading.Lock()


def print_result(result, output_image, timestamp_ms):
    global latest_result
    with result_lock:
        latest_result = result


def cycle_part(state, direction):
    state.step_mode(direction)


def run():
    BaseOptions = mp.tasks.BaseOptions
    GestureRecognizer = mp.tasks.vision.GestureRecognizer
    GestureRecognizerOptions = mp.tasks.vision.GestureRecognizerOptions
    VisionRunningMode = mp.tasks.vision.RunningMode

    options = GestureRecognizerOptions(
        base_options=BaseOptions(model_asset_path=MODEL_PATH),
        running_mode=VisionRunningMode.LIVE_STREAM,
        result_callback=print_result,
    )

    assets = AssetLibrary()
    state = OutfitState()

    print(f"Loaded {assets.count('body')} body images")
    print(f"Loaded {assets.count('top')} top images")
    print(f"Loaded {assets.count('bottom')} bottom images")
    print(f"Loaded {assets.count('shoes')} shoes images")
    print(f"Loaded {assets.count('nose')} nose images")
    print(f"Loaded {assets.count('eyes')} eyes images")

    with GestureRecognizer.create_from_options(options) as recognizer:
        cap = cv2.VideoCapture(0)
        last_timestamp_ms = 0

        try:
            cv2.namedWindow('Camera', cv2.WINDOW_NORMAL)
            cv2.namedWindow('Character', cv2.WINDOW_NORMAL)

            while cap.isOpened():
                ret, frame = cap.read()
                if not ret:
                    continue

                frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
                frame_timestamp_ms = max(last_timestamp_ms + 1, time.monotonic_ns() // 1_000_000)
                last_timestamp_ms = frame_timestamp_ms
                recognizer.recognize_async(mp_image, frame_timestamp_ms)

                display_frame = cv2.flip(frame.copy(), 1)
                body_center_x = display_frame.shape[1] // 2
                body_center_y = display_frame.shape[0] // 2

                with result_lock:
                    current_result = latest_result

                if current_result and current_result.hand_landmarks and current_result.handedness:
                    for hand_index, hand_landmarks in enumerate(current_result.hand_landmarks):
                        hand_label = current_result.handedness[hand_index][0].category_name
                        if hand_label == 'Right':
                            swipe_direction = detect_swipe(hand_landmarks, 'right')
                            if swipe_direction is not None:
                                current_time = time.time()
                                if current_time - state.last_swipe_time > SWIPE_COOLDOWN:
                                    if swipe_direction in ('up', 'down'):
                                        cycle_part(state, swipe_direction)
                                    elif swipe_direction in ('left', 'right'):
                                        available_count = assets.count(state.selected_part)
                                        state.step_current_index(swipe_direction, available_count)
                                    state.last_swipe_time = current_time

                            live_hue_degrees = angle_from_wrist_to_index_mcp(hand_landmarks)
                            live_saturation = hand_openness(hand_landmarks)
                            live_color_bgr = hue_to_bgr(live_hue_degrees, min(int(live_saturation * 255), 255))

                selected_layers = [
                    assets.get('bottom', state.current_indices['bottom']),
                    assets.get('top', state.current_indices['top']),
                    assets.get('shoes', state.current_indices['shoes']),
                    assets.get('nose', state.current_indices['nose']),
                    assets.get('eyes', state.current_indices['eyes']),
                ]
                current_body = assets.get('body', state.current_indices['body'])
                character_display = compose_outfit(current_body, selected_layers)

                cv2.putText(display_frame, 'Press S to save character | Q to quit', (10, 30),
                           cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 2, cv2.LINE_AA)
                cv2.putText(character_display, f'Body {state.current_indices["body"] + 1}/{assets.count("body")}',
                           (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)
                cv2.putText(character_display, f'Top {state.current_indices["top"] + 1}/{assets.count("top")}',
                           (20, 75), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)
                cv2.putText(character_display, f'Bottom {state.current_indices["bottom"] + 1}/{assets.count("bottom")}',
                           (20, 110), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)
                cv2.putText(character_display, f'Shoes {state.current_indices["shoes"] + 1}/{assets.count("shoes")}',
                           (20, 145), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)
                cv2.putText(character_display, f'Nose {state.current_indices["nose"] + 1}/{assets.count("nose")}',
                           (20, 180), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)
                cv2.putText(character_display, f'Eyes {state.current_indices["eyes"] + 1}/{assets.count("eyes")}',
                           (20, 215), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)
                cv2.putText(character_display, f'Mode: {state.selected_part}',
                           (20, 250), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)
                cv2.putText(character_display, 'Swipe up/down: change part',
                           (20, 285), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2, cv2.LINE_AA)
                cv2.putText(character_display, 'Swipe left/right: change option',
                           (20, 310), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 0, 0), 2, cv2.LINE_AA)

                draw_knob_ui(display_frame, 150, 150, 0, 255, (0, 255, 0))
                cv2.imshow('Camera', display_frame)
                cv2.imshow('Character', character_display)

                key = cv2.waitKey(1) & 0xFF
                if key == ord('q'):
                    break
                elif key == ord('s'):
                    timestamp = time.strftime('%Y%m%d_%H%M%S')
                    filename = (
                        f'character_body{state.current_indices["body"]}'
                        f'_top{state.current_indices["top"]}'
                        f'_bottom{state.current_indices["bottom"]}'
                        f'_shoes{state.current_indices["shoes"]}'
                        f'_nose{state.current_indices["nose"]}'
                        f'_eyes{state.current_indices["eyes"]}_{timestamp}.png'
                    )
                    cv2.imwrite(filename, character_display)
                    print(f'Character saved as {filename}')
        finally:
            cap.release()
            cv2.destroyAllWindows()
