import math


def distance(point_a, point_b):
    return math.hypot(point_a.x - point_b.x, point_a.y - point_b.y)


def angle_from_wrist_to_index_mcp(hand_landmarks):
    wrist = hand_landmarks[0]
    index_mcp = hand_landmarks[5]
    delta_x = index_mcp.x - wrist.x
    delta_y = wrist.y - index_mcp.y
    return math.degrees(math.atan2(delta_y, delta_x)) % 360


def hue_to_bgr(hue_degrees, saturation=255, value=255):
    import cv2
    import numpy as np

    hsv = np.uint8([[[int(hue_degrees / 2), int(np.clip(saturation, 0, 255)), int(np.clip(value, 0, 255))]]])
    return tuple(int(channel) for channel in cv2.cvtColor(hsv, cv2.COLOR_HSV2BGR)[0, 0])


def hand_openness(hand_landmarks):
    wrist = hand_landmarks[0]
    finger_tips = [4, 8, 12, 16, 20]
    palm_size = max(distance(wrist, hand_landmarks[9]), 1e-6)
    average_tip_distance = sum(distance(wrist, hand_landmarks[index]) for index in finger_tips) / len(finger_tips)
    return average_tip_distance / palm_size
