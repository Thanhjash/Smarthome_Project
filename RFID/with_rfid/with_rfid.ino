#include <Servo.h>
#include <SPI.h>
#include <MFRC522.h>

// Định nghĩa các chân
const int TRIG_PIN = 5;          // Chân Trig của cảm biến siêu âm
const int ECHO_PIN = 6;          // Chân Echo của cảm biến siêu âm
const int DOOR_SERVO_PIN = 8;    // Servo cửa
const int LOCK_SERVO_PIN = 7;    // Servo chốt
const int SS_PIN = 10;           // Chân SS của RFID
const int RST_PIN = 9;           // Chân RST của RFID
const int ldrPin = A0;
const int laserPin = 4;    

Servo doorServo;            // Servo điều khiển cửa
Servo lockServo;            // Servo điều khiển chốt
MFRC522 mfrc522(SS_PIN, RST_PIN);  // Khởi tạo RFID

// UID của thẻ được phép
byte authorizedUID1[4] = {0x17, 0x37, 0x06, 0xD8};  // Thẻ của bạn
byte authorizedUID2[4] = {0x1C, 0x0C, 0x0D, 0x22};  // Thẻ khác (nếu có)

bool allowOpening = false;  // Cờ cho phép mở cửa
unsigned long lastRFIDCheck = 0;  // Thời điểm kiểm tra RFID lần cuối
const unsigned long RFID_CHECK_INTERVAL = 5000;  // 5 giây
unsigned long lastLaserPrint = 0;         // Biến nhớ thời gian in log laser gần nhất
const unsigned long LASER_LOG_INTERVAL = 1000;

void setup() {
  //laser
  pinMode(ldrPin, INPUT);
  pinMode( laserPin , OUTPUT);

  digitalWrite( laserPin , HIGH);
  // Cấu hình chân cảm biến siêu âm
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);

  // Gắn servo vào các chân
  doorServo.attach(DOOR_SERVO_PIN);
  lockServo.attach(LOCK_SERVO_PIN);

  // Khởi động SPI và RFID
  SPI.begin();
  mfrc522.PCD_Init();

  // Khởi động Serial để debug
  Serial.begin(9600);
  Serial.println("Hệ thống khởi động.");
  Serial.println("Đưa thẻ RFID vào gần đầu đọc...");

  // Đặt trạng thái ban đầu cho servo
  lockServo.write(100);   // Khóa chốt
  doorServo.write(80);   // Đóng cửa
}

void loop() {
  //laser
  int ldrStatus = analogRead(ldrPin);
  unsigned long now = millis();
  if (now - lastLaserPrint >= LASER_LOG_INTERVAL) {
    if (ldrStatus < 1) {
    Serial.println("Cửa mở");
  }
    else {
    Serial.println("Cửa đóng");
  }
  lastLaserPrint = now;
  Serial.print("Giá trị LDR thô: ");
  Serial.println(ldrStatus);
}

  unsigned long currentTime = millis();
  // Kiểm tra thẻ RFID
  if (mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial()) {
    Serial.print("UID thẻ: ");
    for (byte i = 0; i < mfrc522.uid.size; i++) {
      Serial.print(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");
      Serial.print(mfrc522.uid.uidByte[i], HEX);
    }
    Serial.println();

    // So sánh UID với danh sách cho phép
    if (memcmp(mfrc522.uid.uidByte, authorizedUID1, 4) == 0 || 
        memcmp(mfrc522.uid.uidByte, authorizedUID2, 4) == 0) {
      allowOpening = true;
      Serial.println("Thẻ hợp lệ!");
    } else {
      allowOpening = false;
      Serial.println("Thẻ không hợp lệ!");
    }
    mfrc522.PICC_HaltA();  // Dừng đọc thẻ
    lastRFIDCheck = currentTime; // Cập nhật thời điểm kiểm tra RFID
  }
  // Kiểm tra thẻ mỗi 5 giây
  if (currentTime - lastRFIDCheck >= RFID_CHECK_INTERVAL) {
    if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
      allowOpening = false;
      Serial.println("Không phát hiện thẻ hợp lệ, khóa chốt!");
    }
    lastRFIDCheck = currentTime;  // Cập nhật thời điểm kiểm tra
  }
  // Đo khoảng cách bằng cảm biến siêu âm
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  long duration = pulseIn(ECHO_PIN, HIGH);
  int distance = duration * 0.034 / 2;

  if (allowOpening) {
    lockServo.write(0);   // Mở chốt
  }
  if (allowOpening && distance < 20) {
    delay(1000); // Đợi chốt mở
    doorServo.write(140); // Mở cửa

    // Giữ cửa mở khi có vật thể ở gần
    while (distance < 20) {
      // Đo lại khoảng cách
      digitalWrite(TRIG_PIN, LOW);
      delayMicroseconds(2);
      digitalWrite(TRIG_PIN, HIGH);
      delayMicroseconds(10);
      digitalWrite(TRIG_PIN, LOW);
      duration = pulseIn(ECHO_PIN, HIGH);
      distance = duration * 0.034 / 2;

      if (distance >= 20) {
        break;  // Thoát vòng lặp khi không còn vật thể ở gần
      }
      delay(700);  
    }

    doorServo.write(80);  // Đóng cửa
    delay(500);           // Đợi cửa đóng hoàn toàn
    lockServo.write(100);  // Khóa chốt
    allowOpening = false; // Reset cờ
  }
}