#!/usr/bin/env python3
import os
import subprocess
import sys
import json

def test_camera(rtsp_url):
    env = os.environ.copy()
    env["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;udp"
    
    code = f'''
import cv2
cap = cv2.VideoCapture("{rtsp_url}", cv2.CAP_FFMPEG)
ret, frame = cap.read()
cap.release()
if ret:
    print("SUCCESS")
else:
    print("FAILED")
'''
    
    try:
        result = subprocess.run([sys.executable, '-c', code], 
                              env=env, capture_output=True, text=True, timeout=30)
        if "SUCCESS" in result.stdout:
            return {"success": True, "message": "Camera connected successfully"}
        else:
            return {"success": False, "message": "Cannot connect to camera"}
    except Exception as e:
        return {"success": False, "message": f"Camera test failed: {str(e)}"}

if __name__ == "__main__":
    result = test_camera(sys.argv[1])
    print(json.dumps(result))
    sys.exit(0 if result["success"] else 1)