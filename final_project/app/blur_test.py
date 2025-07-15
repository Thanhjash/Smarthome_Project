import cv2
import numpy as np


def analyze_image(image_path):
    # Read the image
    img = cv2.imread(image_path)
    if img is None:
        print("Error: Could not load image")
        return

    # Convert to grayscale
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

    # Compute Laplacian for blur detection
    laplacian = cv2.Laplacian(img_gray, cv2.CV_64F)
    mean, stddev = cv2.meanStdDev(laplacian)
    std_deviation = stddev[0][0]
    variation = std_deviation ** 2

    # Determine if the image is blurry
    text_blur = "Not Blurry"
    blur_threshold = 100
    if variation < blur_threshold:
        text_blur = "Blurry"

    # Compute the average brightness for lighting condition
    mean_brightness = np.mean(img_gray)
    low_threshold = 50
    high_threshold = 200

    # Determine lighting condition
    if mean_brightness < low_threshold:
        lighting_condition = "Too Dark"
    elif mean_brightness > high_threshold:
        lighting_condition = "Too Bright"
    else:
        lighting_condition = "Good Lighting"

    print(f"Standard Deviation: {std_deviation}")
    print(f"Variation: {variation}")
    print(f"Blur Detection: {text_blur}")
    print(f"Average Brightness: {mean_brightness}")
    print(f"Lighting Condition: {lighting_condition}")

    # Display results on the image
    cv2.putText(img, f"{text_blur}: {variation:.2f}", (10, 30),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (0, 0, 255), 1)
    cv2.putText(img, f"{lighting_condition}: {mean_brightness:.2f}", (10, 60),
                cv2.FONT_HERSHEY_SIMPLEX, 0.4, (255, 0, 0), 1)
    cv2.imshow("Image Analysis", img)
    cv2.waitKey(0)
    cv2.destroyAllWindows()


# Test with a sample image
analyze_image("maxresdefault.jpg")
