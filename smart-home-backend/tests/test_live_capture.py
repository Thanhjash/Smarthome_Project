# test_live_capture.py
import os
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;udp"
import cv2

cap = cv2.VideoCapture("rtsp://admin:251005PAnh@192.168.3.100:554/onvif1", cv2.CAP_FFMPEG)
ret, frame = cap.read()
cap.release()

if ret:
    cv2.imwrite("live_test.jpg", frame)
    print("✅ Live capture saved to live_test.jpg")
else:
    print("❌ Cannot capture live frame")