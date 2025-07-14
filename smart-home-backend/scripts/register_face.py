import os
import sys
import json
import cv2

def register_face(name, image_path):
    try:
        # Check if file exists
        if not os.path.exists(image_path):
            return {"success": False, "message": f"File not found: {image_path}"}
        
        # Test image reading
        image = cv2.imread(image_path)
        if image is None:
            return {"success": False, "message": "Cannot read image file"}
        
        return {"success": True, "message": f"Face registered for {name}"}
    except Exception as e:
        return {"success": False, "message": f"Registration failed: {str(e)}"}