import os
import sys

# === BẮT ĐẦU KHỐI LỆNH ẨN CẢNH BÁO ===
# Đặt biến môi trường TRƯỚC KHI import tensorflow/deepface
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import warnings
import logging

# Chặn tất cả các cảnh báo và log
warnings.filterwarnings('ignore')
logging.getLogger('tensorflow').setLevel(logging.FATAL)
# === KẾT THÚC KHỐI LỆNH ẨN CẢNH BÁO ===

import json
import cv2
from deepface import DeepFace

def register_face(name, image_path):
    try:
        if not os.path.exists(image_path):
            return {"success": False, "message": f"File not found: {image_path}"}
        
        face_objects = DeepFace.extract_faces(
            img_path=image_path, 
            detector_backend='ssd',
            enforce_detection=False
        )
        
        num_faces = len(face_objects)
        
        if num_faces == 1:
            return {"success": True, "message": f"Valid face found for {name}. Registration successful."}
        elif num_faces == 0:
            return {"success": False, "message": "No face detected. Please ensure good lighting and face is clear."}
        else:
            return {"success": False, "message": f"Too many faces ({num_faces}). Only one person allowed."}

    except Exception as e:
        return {"success": False, "message": f"Registration error: {str(e)}"}

if __name__ == "__main__":
    result = register_face(sys.argv[2], sys.argv[3]) if len(sys.argv) > 3 else register_face(sys.argv[1], sys.argv[2])
    print(json.dumps(result))
    sys.exit(0 if result["success"] else 1)