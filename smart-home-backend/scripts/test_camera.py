# smart-home-backend\scripts\test_camera.py
import sys
import cv2
import json

def test_camera(rtsp_url):
    try:
        # Thay đổi tùy chọn kết nối sang TCP
        # Thêm biến môi trường để ưu tiên TCP
        import os
        os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
        
        cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
        
        if not cap.isOpened():
            return {"success": False, "message": "Cannot open camera stream."}
        
        ret, frame = cap.read()
        cap.release()
        
        if ret:
            return {"success": True, "message": "Camera connected successfully"}
        else:
            return {"success": False, "message": "Cannot capture frame from stream"}
            
    except Exception as e:
        return {"success": False, "message": f"Camera test failed: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "message": "RTSP URL is required."}))
        sys.exit(1)
        
    rtsp_url = sys.argv[1]
    result = test_camera(rtsp_url)
    print(json.dumps(result))
    sys.exit(0 if result["success"] else 1)