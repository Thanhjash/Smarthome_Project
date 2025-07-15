import os
import sys

# === BẮT ĐẦU KHỐI LỆNH ẨN CẢNH BÁO ===
os.environ['TF_ENABLE_ONEDNN_OPTS'] = '0'
os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'

import warnings
import logging

warnings.filterwarnings('ignore')
logging.getLogger('tensorflow').setLevel(logging.FATAL)
# === KẾT THÚC KHỐI LỆNH ẨN CẢNH BÁO ===

import json
from deepface import DeepFace

def recognize_from_file(image_path, db_path):
    try:
        if not os.path.exists(image_path):
            return {"success": False, "recognized": False, "message": "Image file not found."}

        if not os.path.exists(db_path) or not any(os.scandir(db_path)):
            return {"success": True, "recognized": False, "message": "Face database is empty."}
        
        results = DeepFace.find(
            img_path=image_path, 
            db_path=db_path,
            model_name='Facenet512',
            detector_backend='ssd',
            enforce_detection=False,
            silent=True
        )
        
        if results and not results[0].empty:
            first_result = results[0].iloc[0]
            identity_path = first_result['identity']
            person_name = os.path.basename(os.path.dirname(identity_path))
            return {"success": True, "recognized": True, "name": person_name}
        else:
            return {"success": True, "recognized": False, "message": "No matching face found"}
            
    except Exception as e:
        return {"success": False, "recognized": False, "message": f"An error occurred during recognition: {str(e)}"}

if __name__ == "__main__":
    result = recognize_from_file(sys.argv[1], sys.argv[2])
    print(json.dumps(result))
    sys.exit(0) # Luôn thoát với code 0 cho nhận diện, vì "không tìm thấy" không phải là lỗi hệ thống