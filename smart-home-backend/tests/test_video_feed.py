# test_video_stream.py
import os
import subprocess
import sys

env = os.environ.copy()
env["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;udp"

code = '''
import cv2
cap = cv2.VideoCapture("rtsp://admin:251005PAnh@192.168.3.100:554/onvif1", cv2.CAP_FFMPEG)

for i in range(5):
    ret, frame = cap.read()
    if ret:
        cv2.imwrite(f"frame_{i}.jpg", frame)
        print(f"Frame {i}: {frame.shape}")
    else:
        print(f"Frame {i}: Failed")

cap.release()
'''

subprocess.run([sys.executable, '-c', code], env=env)