from __future__ import absolute_import, division, print_function

import argparse
import os
from PIL import Image
import imageio.v2 as imageio
import numpy as np
from ultralytics import YOLO
import cv2

# -------------------------------
# Helper Classes and Functions
# -------------------------------

class ImageClass:
    def __init__(self, name, image_paths):
        self.name = name
        self.image_paths = image_paths

def get_dataset(input_dir):
    dataset = []
    input_dir = os.path.expanduser(input_dir)
    class_names = sorted(os.listdir(input_dir))

    for class_name in class_names:
        class_path = os.path.join(input_dir, class_name)
        if not os.path.isdir(class_path):
            continue
        image_paths = []
        for file_name in os.listdir(class_path):
            if file_name.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
                image_paths.append(os.path.join(class_path, file_name))
        if image_paths:
            dataset.append(ImageClass(class_name, image_paths))

    return dataset

def to_rgb(img):
    """Convert grayscale image to RGB by stacking channels"""
    return np.stack((img,) * 3, axis=-1)

# -------------------------------
# Main Function
# -------------------------------

def main(args):
    dataset = get_dataset(args.input_dir)

    model = YOLO('yolov11n-face.pt')  # You can replace this with any other YOLOv8 model

    total_images = 0
    total_labeled = 0

    # Create a dictionary to map person names to class IDs
    class_name_to_id = {cls.name: idx for idx, cls in enumerate(dataset)}

    for cls in dataset:
        output_class_dir = os.path.join(args.output_dir, cls.name)
        os.makedirs(output_class_dir, exist_ok=True)

        for image_path in cls.image_paths:
            total_images += 1
            filename = os.path.splitext(os.path.basename(image_path))[0]
            label_path = os.path.join(output_class_dir, f"{filename}.txt")

            if os.path.exists(label_path):
                print(f"Label already exists for {filename}, skipping.")
                continue

            try:
                img = imageio.imread(image_path)
            except Exception as e:
                print(f"Failed to read {image_path}: {e}")
                continue

            if img.ndim == 2:  # Grayscale image
                img = to_rgb(img)
            img = img[:, :, 0:3]  # Ensure 3 channels
            resized_img = cv2.resize(img, (640, 640))
            img_height, img_width = resized_img.shape[:2]

            image_pil = Image.fromarray(resized_img)
            detections = []
            for _ in range(7):
                result = model(image_pil)[0]
                boxes = result.boxes.xyxy.cpu().numpy() if result.boxes is not None else []
                if len(boxes) > 0:
                    detections.append(boxes)

            # If no detections after 10 tries, skip this image
            if len(detections) < 2:
                print(f"No face detected in {image_path} after 10 attempts.")
                continue

            # Use detections from the last successful detection
            boxes = detections[-1]

            # Get the class ID for the current person (based on the folder name)
            class_id = class_name_to_id[cls.name]

            with open(label_path, "w") as label_file:
                for box in boxes:
                    x1, y1, x2, y2 = box[:4]
                    x_center = ((x1 + x2) / 2) / img_width
                    y_center = ((y1 + y2) / 2) / img_height
                    width = (x2 - x1) / img_width
                    height = (y2 - y1) / img_height

                    # Write the class ID and normalized bounding box values to the label file
                    label_file.write(f"{class_id} {x_center:.6f} {y_center:.6f} {width:.6f} {height:.6f}\n")

            total_labeled += 1
            print(f"Labeled: {image_path} → {label_path}")

    print(f"\nProcessed {total_images} images.")
    print(f"Successfully labeled {total_labeled} images.")

# -------------------------------
# CLI Argument Parsing
# -------------------------------

def get_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument('--input_dir', type=str, default='./train', help='Directory with class-based image folders.')
    parser.add_argument('--output_dir', type=str, default='./labels', help='Directory to save YOLO label files.')
    return parser.parse_args()

# -------------------------------
# Entry Point
# -------------------------------

if __name__ == '__main__':
    args = get_arguments()
    main(args)
