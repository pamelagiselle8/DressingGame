import math

import numpy as np

from .config import POSITION_HISTORY_SIZE

hand_position_history = {}


def distance(point_a, point_b):
    return math.hypot(point_a.x - point_b.x, point_a.y - point_b.y)


def is_hand_closed_with_index_only(hand_landmarks):
    wrist = hand_landmarks[0]
    index_tip = hand_landmarks[8]
    middle_tip = hand_landmarks[12]
    ring_tip = hand_landmarks[16]
    pinky_tip = hand_landmarks[20]

    index_dist = distance(wrist, index_tip)
    middle_dist = distance(wrist, middle_tip)
    ring_dist = distance(wrist, ring_tip)
    pinky_dist = distance(wrist, pinky_tip)

    index_extended = index_dist > 0.15
    others_closed = (
        middle_dist < index_dist * 0.7 and
        ring_dist < index_dist * 0.7 and
        pinky_dist < index_dist * 0.7
    )

    return index_extended and others_closed


def detect_swipe(hand_landmarks, hand_id='right'):
    if not is_hand_closed_with_index_only(hand_landmarks):
        return None

    index_tip = hand_landmarks[8]
    index_mcp = hand_landmarks[5]
    current_position = (
        index_tip.x - index_mcp.x,
        index_tip.y - index_mcp.y,
    )

    if hand_id not in hand_position_history:
        hand_position_history[hand_id] = []

    history = hand_position_history[hand_id]
    history.append(current_position)

    if len(history) > POSITION_HISTORY_SIZE:
        history.pop(0)

    if len(history) < 3:
        return None

    old_x, old_y = history[0]
    new_x, new_y = history[-1]
    delta_x = new_x - old_x
    delta_y = new_y - old_y

    if abs(delta_y) > abs(delta_x) and abs(delta_y) > 0.04:
        return 'up' if delta_y < 0 else 'down'

    if abs(delta_x) > 0.04:
        return 'right' if delta_x > 0 else 'left'

    return None
