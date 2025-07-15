from __future__ import print_function

import sys
from tkinter import *
from PIL import Image, ImageTk
import threading
import imutils
import cv2
import os
import shutil


class Gui:
    def __init__(self):
        print("Initializing Gui...")
        self.init_width = 640
        self.init_height = 640
        self.capture_idx = 0
        self.batch_size = 500
        self.is_capture = False
        self.folder = ''
        self.capture_scr = None
        self.frame = None
        self.capture_thread = None
        self.stop_event = None
        self.video_stream = None
        self.message = ""
        self.message_color = (0, 255, 0)

        self.window = Tk()
        self.window.geometry(f"{self.init_width}x{self.init_height}")
        self.window.resizable(False, False)
        self.window.title("Test: ")

        self.bottom_bar = Frame(self.window)
        self.bottom_bar.pack(side='bottom')

        self.folder_label = Label(self.bottom_bar, text='Enter your images folder:')
        self.folder_label.grid(column=0, row=0)

        self.input_text = StringVar()
        self.folder_textbox = Entry(self.bottom_bar, textvariable=self.input_text)
        self.folder_textbox.grid(column=1, row=0)

        self.capture_btn = Button(self.bottom_bar, text='Click to capture!', command=self._start_capture,
                                  state=self._should_enable_capture())
        self.capture_btn.grid(column=2, row=0)

        self._prepare_video_capture()
        self.input_text.trace('w', self._update_capture_btn)

        # Handle window close event
        self.window.protocol("WM_DELETE_WINDOW", self._on_close)

    def __del__(self):
        print("Destroying GUI...")
        self._cleanup()

    def _on_close(self):
        print("Closing application...")
        self._cleanup()
        self.window.quit()
        self.window.update()  # Ensure all Tkinter events are processed
        os._exit(0)  # Force exit to stop all threads immediately

    def _cleanup(self):
        """Ensure all threads and resources are closed properly"""
        if self.stop_event:
            self.stop_event.set()  # Stop the video thread

        if self.capture_thread and self.capture_thread.is_alive():
            self.capture_thread.join(timeout=2)  # Give it time to stop

        if self.video_stream and self.video_stream.isOpened():
            self.video_stream.release()  # Release webcam resource

        cv2.destroyAllWindows()  # Close all OpenCV windows

    def start(self):
        self.window.mainloop()

    def _update_capture_btn(self, *args):
        self.capture_btn.configure(state=self._should_enable_capture())

    def _should_enable_capture(self):
        return NORMAL if not self.is_capture and self.input_text.get() else DISABLED

    def _prepare_video_capture(self):
        self.video_stream = cv2.VideoCapture(0)
        if not self.video_stream.isOpened():
            raise Exception("Video stream is not opened!")
        self.stop_event = threading.Event()
        self.capture_thread = threading.Thread(target=self._video_loop, args=())
        self.capture_thread.start()

    def _dat_analyze_image(self, img):
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        laplacian = cv2.Laplacian(gray, cv2.CV_64F)
        std_dev = cv2.meanStdDev(laplacian)[1][0][0]
        variation = std_dev ** 2
        brightness = cv2.mean(gray)[0]

        blur_threshold = 100  # Adjust as needed
        brightness_threshold = (50, 200)  # Acceptable brightness range

        is_blurry = variation < blur_threshold
        is_bad_lighting = brightness < brightness_threshold[0] or brightness > brightness_threshold[1]
        return is_blurry, is_bad_lighting

    def _overlay_message(self, frame, message, color):
        cv2.putText(frame, message, (50, 350), cv2.FONT_HERSHEY_SIMPLEX, 1, color, 2)

    def _clear_message(self):
        self.message = ""

    def _save_images(self):
        path = os.path.join(os.getcwd(), f"../train/{self.folder}")
        if not os.path.exists(path):
            os.makedirs(path)
        is_blurry, is_bad_lighting = self._dat_analyze_image(self.frame)

        if is_blurry:
            self.message = "Image is blurry. Retake needed!"
            self.message_color = (0, 0, 255)
        elif is_bad_lighting:
            self.message = "Bad lighting detected. Retake needed!"
            self.message_color = (0, 0, 255)
        else:
            self.message = "Image saved successfully!"
            self.message_color = (0, 255, 0)
            cv2.imwrite(os.path.join(path, f"{self.capture_idx}.jpg"), self.frame)
            self.capture_idx += 1

        if is_blurry or is_bad_lighting:
            self.is_capture = False
            shutil.rmtree(path, ignore_errors=True)
        else:
            if self.capture_idx >= self.batch_size:
                self.capture_idx = 0
                self.folder = ''
                self.is_capture = False
                self._update_capture_btn()
                self.input_text.set('')
                print("Capture done!")

        self.window.after(2000, self._clear_message)  # Clear message after 2 seconds

    def _video_loop(self):
        print('Capturing...')
        try:
            while not self.stop_event.is_set():
                ret, self.frame = self.video_stream.read()
                if not ret:
                    self.stop_event.set()
                    print("Cannot read frame!")
                    break

                if self.is_capture:
                    self._save_images()

                if self.message:
                    self._overlay_message(self.frame, self.message, self.message_color)

                self.frame = imutils.resize(self.frame, height=self.init_height, width=self.init_width)
                image = cv2.cvtColor(self.frame, cv2.COLOR_BGR2RGB)
                image = Image.fromarray(image)
                image = ImageTk.PhotoImage(image)

                if self.capture_scr is None:
                    self.capture_scr = Label(image=image)
                    self.capture_scr.image = image
                    self.capture_scr.pack(side='top', padx=10, pady=10)
                else:
                    self.capture_scr.configure(image=image)
                    self.capture_scr.image = image
        except RuntimeError as e:
            print(f"[INFO] Caught a runtime error {e}")

    def _start_capture(self):
        print("Start saving images...")
        self.is_capture = True
        self.folder = self.input_text.get()
        self._update_capture_btn()