import cv2
import matplotlib.pyplot as plt
import os

def draw_yolo_bbox(image_path, label_path):
    # Load the image
    image = cv2.imread(image_path)
    if image is None:
        print(f"Image not found: {image_path}")
        return

    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    height, width = image.shape[:2]

    # Read the label file
    if not os.path.exists(label_path):
        print(f"Label file not found: {label_path}")
        return

    with open(label_path, 'r') as file:
        for line in file:
            parts = line.strip().split()
            if len(parts) != 5:
                continue  # Skip invalid lines
            class_id, x_center, y_center, box_width, box_height = map(float, parts)

            # Convert normalized values to pixel values
            x_center *= width
            y_center *= height
            box_width *= width
            box_height *= height

            # Get top-left and bottom-right corners
            x1 = int(x_center - box_width / 2)
            y1 = int(y_center - box_height / 2)
            x2 = int(x_center + box_width / 2)
            y2 = int(y_center + box_height / 2)

            # Draw the rectangle and class label
            cv2.rectangle(image, (x1, y1), (x2, y2), (255, 0, 0), 2)
            cv2.putText(image, f"Class {int(class_id)}", (x1, y1 - 10),
                        cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 0, 0), 2)

    # Show the result
    plt.imshow(image)
    plt.axis('off')
    plt.title(os.path.basename(image_path))
    plt.show()
draw_yolo_bbox(r"C:\Users\Admin\PycharmProjects\YOLOV7\IoT_project\dataset_face\Hung\images\20250514_013116(0).jpg", r"C:\Users\Admin\PycharmProjects\YOLOV7\IoT_project\dataset_face\Hung\labels\20250514_013116(0).txt")
