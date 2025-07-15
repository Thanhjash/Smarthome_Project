# smart-home-backend\scripts\capture_frame.py
import sys
import cv2
import json
import os

def capture_frame(rtsp_url, output_path):
    try:
        os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"
        
        cap = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)
        
        if not cap.isOpened():
            return {"success": False, "message": "Cannot open camera stream."}
            
        ret, frame = cap.read()
        cap.release()
        
        if ret:
            cv2.imwrite(output_path, frame)
            if os.path.exists(output_path):
                return {"success": True, "message": "Frame captured successfully"}
            else:
                 return {"success": False, "message": "Failed to save captured frame"}
        else:
            return {"success": False, "message": "Failed to capture frame"}
            
    except Exception as e:
        return {"success": False, "message": f"Capture failed: {str(e)}"}

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print(json.dumps({"success": False, "message": "Usage: capture_frame.py <rtsp_url> <output_path>"}))
        sys.exit(1)
    
    rtsp_url = sys.argv[1]
    output_path = sys.argv[2]
    
    result = capture_frame(rtsp_url, output_path)
    print(json.dumps(result)) # Luôn in kết quả ra stdout