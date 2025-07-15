import cv2

# Replace with your actual RTSP URL
url = "rtsp://admin:251005PAnh@172.16.130.48:554/onvif1"

cap = cv2.VideoCapture(url)

while True:
    ret, frame = cap.read()
    if not ret:
        print("Failed to grab frame.")
        break

    cv2.imshow("Yoosee Camera", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()