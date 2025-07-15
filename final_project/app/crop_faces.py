import os

def crop_faces(image_path, output_folder):
    image = cv2.imread(image_path)
    results = model(image)

    for i, box in enumerate(results[0].boxes.xyxy):
        x1, y1, x2, y2 = map(int, box)  # Convert bounding box to integer
        face = image[y1:y2, x1:x2]  # Crop face
        cv2.imwrite(f"{output_folder}/face_{i}.jpg", face)

os.makedirs("cropped_faces", exist_ok=True)
crop_faces("input.jpg", "cropped_faces")
