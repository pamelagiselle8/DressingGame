from flask import Flask, render_template, request, jsonify, send_file
from flask_cors import CORS
import cv2
import math
import threading
import time
import os
import glob
import base64
import numpy as np
from io import BytesIO

import mediapipe as mp

model_path = './gesture_recognizer.task'

BaseOptions = mp.tasks.BaseOptions
GestureRecognizer = mp.tasks.vision.GestureRecognizer
GestureRecognizerOptions = mp.tasks.vision.GestureRecognizerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

app = Flask(__name__)
CORS(app)

# Load body images
def load_body_images():
    """Load all body images from the body folder."""
    body_folder = './body'
    image_files = sorted(glob.glob(os.path.join(body_folder, '*.png')))
    
    images = []
    for img_path in image_files:
        img = cv2.imread(img_path, cv2.IMREAD_UNCHANGED)
        if img is not None:
            images.append((img_path, img))
    
    return images

body_images = load_body_images()
current_body_index = 0
body_lock = threading.Lock()

def distance(point_a, point_b):
    return math.hypot(point_a.x - point_b.x, point_a.y - point_b.y)

def is_hand_closed_with_index_only(hand_landmarks):
    """Detect if hand is closed with only index finger extended."""
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
    others_closed = (middle_dist < index_dist * 0.7 and 
                     ring_dist < index_dist * 0.7 and 
                     pinky_dist < index_dist * 0.7)
    
    return index_extended and others_closed

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

def create_character_display(body_image, width=600, height=800, bg_color=(255, 255, 255)):
    """Create a clean display of the character with a solid background."""
    if body_image is None:
        return np.ones((height, width, 3), dtype=np.uint8) * np.array(bg_color, dtype=np.uint8)
    
    canvas = np.ones((height, width, 3), dtype=np.uint8) * np.array(bg_color, dtype=np.uint8)
    
    body_height, body_width = body_image.shape[:2]
    scale = 0.7
    new_width = int(width * scale)
    new_height = int(body_height * (new_width / body_width))
    
    if new_height > int(height * 0.9):
        new_height = int(height * 0.9)
        new_width = int(body_width * (new_height / body_height))
    
    resized_body = cv2.resize(body_image, (new_width, new_height))
    
    center_x = width // 2
    center_y = height // 2
    x = int(center_x - new_width // 2)
    y = int(center_y - new_height // 2)
    
    canvas = overlay_rgba(canvas, resized_body, x, y)
    return canvas

def frame_to_base64(frame):
    """Convert OpenCV frame to base64 string."""
    _, buffer = cv2.imencode('.png', frame)
    return base64.b64encode(buffer).decode('utf-8')

@app.route('/')
def index():
    return render_template('index.html', total_bodies=len(body_images))

@app.route('/api/process-frame', methods=['POST'])
def process_frame():
    global current_body_index
    
    try:
        data = request.json
        frame_data = data['frame'].split(',')[1]  # Remove data:image/jpeg;base64, prefix
        nparr = np.frombuffer(base64.b64decode(frame_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        if frame is None:
            return jsonify({'error': 'Invalid frame'}), 400
        
        # Create MediaPipe recognizer (stateless for web)
        options = GestureRecognizerOptions(
            base_options=BaseOptions(model_asset_path=model_path),
            running_mode=VisionRunningMode.IMAGE,
        )
        
        with GestureRecognizer.create_from_options(options) as recognizer:
            frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
            mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=frame_rgb)
            
            result = recognizer.recognize(mp_image)
            
            # Process hand landmarks for swipe detection
            if result.hand_landmarks and result.handedness:
                for hand_index, hand_landmarks in enumerate(result.hand_landmarks):
                    hand_label = result.handedness[hand_index][0].category_name
                    if hand_label == 'Right':
                        if is_hand_closed_with_index_only(hand_landmarks):
                            wrist = hand_landmarks[0]
                            # Send signal that pose is correct
        
        # Flip for mirror effect
        display_frame = cv2.flip(frame, 1)
        
        # Get current body and create character display
        with body_lock:
            current_body = body_images[current_body_index][1] if body_images else None
        
        character_display = create_character_display(current_body)
        
        # Add counter text
        cv2.putText(character_display, f'Character {current_body_index + 1}/{len(body_images)}', 
                   (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 0), 2, cv2.LINE_AA)
        cv2.putText(display_frame, 'Make fist with index extended and move | Press S to save', 
                   (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 1)
        
        return jsonify({
            'camera_frame': frame_to_base64(display_frame),
            'character_frame': frame_to_base64(character_display),
            'current_body_index': current_body_index,
            'total_bodies': len(body_images)
        })
    
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/api/change-body', methods=['POST'])
def change_body():
    global current_body_index
    
    data = request.json
    direction = data.get('direction', 'right')
    
    with body_lock:
        if direction == 'right':
            current_body_index = (current_body_index + 1) % len(body_images)
        elif direction == 'left':
            current_body_index = (current_body_index - 1) % len(body_images)
    
    return jsonify({'current_body_index': current_body_index})

@app.route('/api/save-character', methods=['POST'])
def save_character():
    try:
        data = request.json
        frame_data = data['frame'].split(',')[1]
        nparr = np.frombuffer(base64.b64decode(frame_data), np.uint8)
        frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        
        timestamp = time.strftime('%Y%m%d_%H%M%S')
        filename = f'character_{current_body_index}_{timestamp}.png'
        cv2.imwrite(filename, frame)
        
        return jsonify({'success': True, 'filename': filename})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    if body_images:
        print(f"Loaded {len(body_images)} body images")
    else:
        print("No body images found in ./body folder")
    
    app.run(debug=True, port=5000)
