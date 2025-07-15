from ultralytics import YOLO
def main():
    model = YOLO('yolov11n-face.pt')
    results = model.train(
        data=r'C:\Users\Admin\PycharmProjects\YOLOV7\IoT_project\face_data.yaml',
        epochs=1000,
        imgsz=640,
        batch=32,
        patience=20,
        name='yolo11_face_wo_QA_final',
        degrees=10,
        fliplr=0.5,
        pretrained=True
    )
if __name__ == '__main__':
    main()