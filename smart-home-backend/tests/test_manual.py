# tests/test_manual.py
import os
import subprocess
import sys
import json

def test_camera(rtsp_url):
    env = os.environ.copy()
    env["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;udp"
    
    code = f'''
import cv2
import json
cap = cv2.VideoCapture("{rtsp_url}", cv2.CAP_FFMPEG)
ret, frame = cap.read()
cap.release()
print(json.dumps({{"success": ret, "message": "Camera test"}}))
'''
    
    try:
        result = subprocess.run([sys.executable, '-c', code], 
                              env=env, capture_output=True, text=True, timeout=10)
        return json.loads(result.stdout.strip())
    except Exception as e:
        return {"success": False, "message": f"Camera connection failed: {e}"}

if __name__ == "__main__":
    rtsp_url = sys.argv[1] if len(sys.argv) > 1 else "rtsp://admin:251005PAnh@192.168.3.100:554/onvif1"
    result = test_camera(rtsp_url)
    print(json.dumps(result))
    sys.exit(0 if result["success"] else 1)