import os
import shutil
import random
import yaml
import re

# === CONFIGURATION ===
source_root = 'dataset_face'
dest_root = 'split_face'
persons = ['Hung', 'QA', 'Thanh', 'Triet', 'Viet_Dat']
splits = ['train', 'validation', 'test']
split_ratio = (0.6, 0.35, 0.05)
image_extensions = ['.jpg', '.jpeg', '.png', '.JPG']

# === CREATE DESTINATION FOLDERS ===
for split in splits:
    for person in persons:
        os.makedirs(os.path.join(dest_root, split, person, 'images'), exist_ok=True)
        os.makedirs(os.path.join(dest_root, split, person, 'labels'), exist_ok=True)

# === COLLECT IMAGE-LABEL PAIRS ===
def collect_pairs(person):
    image_dir = os.path.join(source_root, person, 'images')
    label_dir = os.path.join(source_root, person, 'labels')
    all_files = os.listdir(image_dir)
    base_names = []

    for file in all_files:
        name, ext = os.path.splitext(file)
        if ext.lower() in image_extensions:
            label_file = name + '.txt'
            label_path = os.path.join(label_dir, label_file)
            if os.path.exists(label_path):
                base_names.append(name)
    return base_names

# === SPLIT AND COPY ===
def split_and_copy(person):
    base_names = collect_pairs(person)
    print(f"[{person}] Total pairs: {len(base_names)}")

    random.shuffle(base_names)
    n_total = len(base_names)
    n_train = int(split_ratio[0] * n_total)
    n_val = int(split_ratio[1] * n_total)
    n_test = n_total - n_train - n_val

    splits_data = {
        'train': base_names[:n_train],
        'validation': base_names[n_train:n_train + n_val],
        'test': base_names[n_train + n_val:]
    }

    for split, names in splits_data.items():
        print(f"  → {split}: {len(names)} items")
        for name in names:
            # Copy image
            for ext in image_extensions:
                src_img = os.path.join(source_root, person, 'images', name + ext)
                if os.path.exists(src_img):
                    dst_img = os.path.join(dest_root, split, person, 'images', name + ext)
                    shutil.copy(src_img, dst_img)
                    break
            else:
                print(f"    ⚠️ Image not found for {name}")

            # Copy label
            src_lbl = os.path.join(source_root, person, 'labels', name + '.txt')
            dst_lbl = os.path.join(dest_root, split, person, 'labels', name + '.txt')
            if os.path.exists(src_lbl):
                shutil.copy(src_lbl, dst_lbl)
            else:
                print(f"    ⚠️ Label not found for {name}")

# === MAIN RUN ===
for person in persons:
    split_and_copy(person)

# === WRITE YAML FILE WITH INLINE NAMES LIST ===
yaml_path = os.path.join(dest_root, 'data.yaml')
class_names = list(persons)

yaml_dict = {
    'train': os.path.join(dest_root, 'train'),
    'val': os.path.join(dest_root, 'validation'),
    'test': os.path.join(dest_root, 'test'),
    'nc': len(class_names),
    'names': class_names
}

yaml_text = yaml.dump(yaml_dict, default_flow_style=False)

def convert_names_to_inline(yaml_str):
    pattern = r'names:\n( +- .+\n)+'
    match = re.search(pattern, yaml_str)
    if match:
        names_block = match.group()
        names_lines = names_block.strip().split('\n')[1:]
        names_inline = [line.strip()[2:] for line in names_lines]
        inline_list = f"names: [{', '.join(names_inline)}]\n"
        yaml_str = yaml_str.replace(names_block, inline_list)
    return yaml_str

yaml_text = convert_names_to_inline(yaml_text)

try:
    with open(yaml_path, 'w') as f:
        f.write(yaml_text)
    if os.path.exists(yaml_path):
        print(f"\n✅ YAML file successfully created at: {yaml_path}")
    else:
        print(f"\n❌ Failed to create YAML file at: {yaml_path}")
except Exception as e:
    print(f"\n❌ Error writing YAML file: {e}")
