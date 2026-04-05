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

# Asset selection variables
body_images = []
nose_images = []
eyes_images = []
body_lock = threading.Lock()
SWIPE_COOLDOWN = 0.8  # Seconds between swipes
game_state = {
    'current_body_index': 0,
    'current_nose_index': 0,
    'current_eyes_index': 0,
    'selected_part': 'body',
    'last_swipe_time': 0,
}

# Hand position tracking for swipe detection
hand_position_history = {}  # Will store position history per hand
POSITION_HISTORY_SIZE = 5  # Number of frames to track


from handfit.runner import run


if __name__ == '__main__':
    run()


    hsv = np.zeros((diameter, diameter, 3), dtype=np.uint8)

    hsv[..., 0] = (angle / 2).astype(np.uint8)
