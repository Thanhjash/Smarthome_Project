# debug_capture.py
import os
import subprocess
import sys

env = os.environ.copy()
env["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;udp"

code = '''
import cv2
import sys
print("Starting capture...", file=sys.stderr)
cap = cv2.VideoCapture("rtsp://admin:251005PAnh@192.168.3.100:554/onvif1", cv2.CAP_FFMPEG)
print("VideoCapture created", file=sys.stderr)
ret, frame = cap.read()
print(f"Frame read: {ret}", file=sys.stderr)
if ret:
    cv2.imwrite("debug_frame.jpg", frame)
    print("SUCCESS")
else:
    print("FAILED")
cap.release()
'''

result = subprocess.run([sys.executable, '-c', code], 
                      env=env, capture_output=True, text=True, timeout=10)

print("STDOUT:", result.stdout)
print("STDERR:", result.stderr)