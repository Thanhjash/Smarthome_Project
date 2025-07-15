import cv2
from ultralytics import YOLO
import time
from collections import deque
import pyttsx3
import threading
import queue
import speech_recognition as sr

# --- TTS Engine Setup ---
tts_queue = queue.Queue()
engine = pyttsx3.init()
engine.setProperty('rate', 160)

def tts_worker():
    while True:
        text = tts_queue.get()
        if text is None:
            break  # None is the signal to exit
        engine.say(text)
        engine.runAndWait()
        tts_queue.task_done()

# Start the background thread
tts_thread = threading.Thread(target=tts_worker, daemon=True)
tts_thread.start()

def speak(text):
    tts_queue.put(text)

# --- Speech Recognition ---
def recognize_speech():
    recognizer = sr.Recognizer()
    with sr.Microphone() as source:
        print("Listening for commands...")
        recognizer.pause_threshold = 1
        try:
            audio = recognizer.listen(source, timeout=5)
            query = recognizer.recognize_google(audio, language='en-US')
            print("You said:", query)
            return query.lower()
        except sr.WaitTimeoutError:
            return ""
        except sr.UnknownValueError:
            return ""
        except sr.RequestError:
            return ""

def speech_listener():
    while True:
        query = recognize_speech()
        if not query:
            continue
        if "time" in query:
            now = time.strftime("%I:%M %p")
            speak(f"It is {now}")
        elif "hello" in query:
            speak("Hello boss!")
        elif "stop listening" in query:
            speak("Okay, I'll be quiet.")
            break
        else:
            speak("Sorry, I didn't understand that.")

# --- Load YOLO Models ---
face_model = YOLO(r"C:\Users\Admin\PycharmProjects\YOLOV7\IoT_project\runs\detect\yolo11_face_wo_QA_final\weights\best.pt")
human_model = YOLO(r"C:\Users\Admin\PycharmProjects\YOLOV7\IoT_project\yolo11n.pt")

url = 'http://172.16.133.233:8080/video'
cap = cv2.VideoCapture(url)

# --- Detection State Tracking ---
other_class_detections = deque()
spoken_names = set()
audio_played = {"hi_there": False, "hello_master": False}
speak_names = {'Viet_Dat', 'Thanh', 'Hung', 'QA', 'Triet'}
ignored_names = {}

# --- Main Loop ---
while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break

    start_time = time.time()
    now = time.time()
    detected_human = False

    results = face_model.predict(source=frame, imgsz=frame.shape[:2], device='cuda', conf=0.46, iou=0.72)
    results_human = human_model.predict(source=frame, imgsz=frame.shape[:2], device='cuda', conf=0.4)

    for r in results:
        for box in r.boxes:
            x1, y1, x2, y2 = map(int, box.xyxy[0])
            conf = box.conf[0]
            cls = int(box.cls[0])
            label_name = face_model.names[cls]

            if label_name in ignored_names:
                continue

            if label_name in speak_names and label_name not in spoken_names:
                speak(label_name)
                spoken_names.add(label_name)

            if label_name != 'person':
                other_class_detections.append((now, label_name))

            label = f"{label_name} {conf:.2f}"
            cv2.rectangle(frame, (x1, y1), (x2, y2), (0, 255, 0), 2)
            cv2.putText(frame, label, (x1, y1 - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 0), 2)

    for rh in results_human:
        for box in rh.boxes:
            cls = int(box.cls[0])
            label = human_model.names[cls]
            if label == 'person':
                detected_human = True
                break

    if detected_human and not audio_played["hi_there"]:
        speak("Hi there")
        audio_played["hi_there"] = True

    # Clean up old detections
    while other_class_detections and now - other_class_detections[0][0] > 60:
        other_class_detections.popleft()

    if len(other_class_detections) >= 3 and not audio_played["hello_master"]:
        speak("Face confirmed. Hello master.")
        audio_played["hello_master"] = True
        # Start speech listener in new thread
        threading.Thread(target=speech_listener, daemon=True).start()

    fps = 1 / (time.time() - start_time)
    cv2.putText(frame, f"FPS: {fps:.2f}", (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 0, 255), 2)
    cv2.imshow("YOLO Real-Time Inference", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Cleanup
cap.release()
cv2.destroyAllWindows()
tts_queue.put(None)  # Stop the TTS thread
tts_thread.join()
