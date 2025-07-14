#!/usr/bin/env python3
import sys
import os
import subprocess
import json
import logging

# Suppress ALL logging
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
logging.getLogger('deepface').setLevel(logging.CRITICAL)
logging.getLogger().setLevel(logging.CRITICAL)

import warnings
warnings.filterwarnings('ignore')

from deepface import DeepFace

def recognize_face(rtsp_url, db_path):
    try:
        env = os.environ.copy()
        env["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;udp"
        env['TF_CPP_MIN_LOG_LEVEL'] = '3'
        
        code = f'''
import cv2
cap = cv2.VideoCapture("{rtsp_url}", cv2.CAP_FFMPEG)
ret, frame = cap.read()
if ret:
    cv2.imwrite("temp_frame.jpg", frame)
    print("SUCCESS")
else:
    print("FAILED")
cap.release()
'''
        
        result = subprocess.run([sys.executable, '-c', code], 
                              env=env, capture_output=True, text=True, timeout=10)
        
        if "SUCCESS" not in result.stdout:
            return {"success": False, "message": "Cannot capture frame"}
        
        if not os.path.exists(db_path) or not os.listdir(db_path):
            if os.path.exists("temp_frame.jpg"):
                os.remove("temp_frame.jpg")
            return {"success": True, "recognized": False, "message": "No faces in database"}
        
        # Suppress stdout during DeepFace operation
        old_stdout = sys.stdout
        sys.stdout = open(os.devnull, 'w')
        
        results = DeepFace.find("temp_frame.jpg", db_path=db_path, enforce_detection=False)
        
        # Restore stdout
        sys.stdout.close()
        sys.stdout = old_stdout
        
        if os.path.exists("temp_frame.jpg"):
            os.remove("temp_frame.jpg")
        
        if len(results[0]) > 0:
            identity_path = results[0].iloc[0]['identity']
            person_name = os.path.basename(os.path.dirname(identity_path))
            confidence = results[0].iloc[0]['distance']
            return {"success": True, "recognized": True, "name": person_name, "confidence": float(confidence)}
        else:
            return {"success": True, "recognized": False, "message": "No matching face found"}
            
    except Exception as e:
        return {"success": False, "message": f"Recognition failed: {str(e)}"}

if __name__ == "__main__":
    result = recognize_face(sys.argv[1], sys.argv[2])
    print(json.dumps(result))