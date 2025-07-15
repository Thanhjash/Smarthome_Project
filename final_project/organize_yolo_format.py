import os
import shutil

def organize_dataset_face(train_dir='Train', label_dir='labels', output_dir=r'C:\Users\Admin\PycharmProjects\YOLOV7\IoT_project\dataset_face'):
    # List all categories from Train folder
    categories = [d for d in os.listdir(train_dir) if os.path.isdir(os.path.join(train_dir, d))]

    for category in categories:
        # Define source paths
        src_images = os.path.join(train_dir, category)
        src_labels = os.path.join(label_dir, category)

        # Define destination paths
        dst_category = os.path.join(output_dir, category)
        dst_images = os.path.join(dst_category, 'images')
        dst_labels = os.path.join(dst_category, 'labels')

        # Create destination folders
        os.makedirs(dst_images, exist_ok=True)
        os.makedirs(dst_labels, exist_ok=True)

        # Copy images
        if os.path.exists(src_images):
            for img_file in os.listdir(src_images):
                if img_file.lower().endswith(('.png', '.jpg', '.jpeg', '.bmp')):
                    shutil.copy2(os.path.join(src_images, img_file), dst_images)

        # Copy labels
        if os.path.exists(src_labels):
            for label_file in os.listdir(src_labels):
                if label_file.lower().endswith('.txt'):
                    shutil.copy2(os.path.join(src_labels, label_file), dst_labels)

    print("Dataset organized successfully.")

# Run the function
organize_dataset_face()
