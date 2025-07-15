#include <ESP32Servo.h>
#include <SPI.h>
#include <MFRC522.h>
#include <ArduinoJson.h> // Kept for potential future use, but not required for this version.

// =========================================================================
// PIN DEFINITIONS AND DEVICE SETUP
// =========================================================================
const int CUSTOM_MOSI_PIN = 11;
const int CUSTOM_MISO_PIN = 12;
const int CUSTOM_SCK_PIN  = 13;
const int TRIG_PIN = 5;
const int ECHO_PIN = 6;
const int DOOR_SERVO_PIN = 8;
const int LOCK_SERVO_PIN = 7;
const int LASER_PIN = 2;
const int SS_PIN = 10;
const int RST_PIN = 9;
const int LDR_PIN = 4;

// --- Servo and State Configuration ---
const int LOCK_ANGLE_LOCKED = 100;
const int LOCK_ANGLE_UNLOCKED = 0;
const int DOOR_ANGLE_CLOSED = 80;
const int DOOR_ANGLE_OPEN = 140;
const unsigned long UNLOCK_TIMEOUT = 10000; // 10 seconds
const unsigned long DOOR_CLOSE_DELAY = 1500; // 1.5 seconds
const unsigned long CLOSING_GRACE_PERIOD = 500; // 0.5 seconds
const int DISTANCE_THRESHOLD = 25; // in cm
const int LDR_THRESHOLD = 500;

// --- Device Objects ---
Servo doorServo;
Servo lockServo;
MFRC522 mfrc522(SS_PIN, RST_PIN);

// --- State Machine ---
enum State { LOCKED, UNLOCKED, DOOR_OPEN, CLOSING };
State currentState = LOCKED;
unsigned long stateChangeTime = 0;

// --- Authorized RFID Cards ---
byte authorizedUID1[4] = {0x17, 0x37, 0x06, 0xD8};
byte authorizedUID2[4] = {0x1C, 0x0C, 0x0D, 0x22};

// --- Forward declarations ---
void setState(State newState);

// =========================================================================
// SETUP
// =========================================================================
void setup() {
  Serial.begin(115200);
  Serial.println("\nSmart Door Security System (Offline Mode) Initializing...");

  // Initialize all hardware pins
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  pinMode(LDR_PIN, INPUT);
  pinMode(LASER_PIN, OUTPUT);
  digitalWrite(LASER_PIN, HIGH); // Turn the laser on

  // Attach servos
  doorServo.attach(DOOR_SERVO_PIN);
  lockServo.attach(LOCK_SERVO_PIN);

  // Initialize RFID reader
  SPI.begin(CUSTOM_SCK_PIN, CUSTOM_MISO_PIN, CUSTOM_MOSI_PIN, -1);
  mfrc522.PCD_Init();

  // Set the initial state to LOCKED
  setState(LOCKED);
  Serial.println("System is LOCKED. Please scan a valid card.");
}

// =========================================================================
// MAIN LOOP
// =========================================================================
void loop() {
  // The core logic is managed by this state machine.
  switch (currentState) {
    case LOCKED:
      // In LOCKED state, we only check for a valid RFID card.
      if (isCardPresent() && isCardAuthorized()) {
        // The isCardAuthorized() function handles the state change.
      }
      break;

    case UNLOCKED:
      // When unlocked, wait for a person to approach the door.
      if (getDistance() < DISTANCE_THRESHOLD) {
        setState(DOOR_OPEN);
      } 
      // If no one approaches after the timeout, re-lock the door for security.
      else if (millis() - stateChangeTime > UNLOCK_TIMEOUT) {
        Serial.println("Timeout reached. Re-locking door.");
        setState(LOCKED);
      }
      break;

    case DOOR_OPEN:
      // When the door is open, wait for the person to pass through.
      if (!isObstructionDetected()) {
        setState(CLOSING);
      }
      break;

    case CLOSING:
      // When closing, constantly check for obstructions as a safety measure.
      if (millis() - stateChangeTime > CLOSING_GRACE_PERIOD) {
        if (isObstructionDetected()) {
          Serial.println("Obstruction detected! Re-opening door.");
          setState(DOOR_OPEN);
          break; // Exit the CLOSING case to immediately handle the re-open.
        }
      }
      // If the door has been closing for long enough, lock it.
      if (millis() - stateChangeTime > DOOR_CLOSE_DELAY) {
        setState(LOCKED);
      }
      break;
  }
  
  // A small delay to keep the loop from running too fast.
  delay(50);
}

// =========================================================================
// HELPER FUNCTIONS
// =========================================================================

// This function manages the state transitions and controls the servos.
void setState(State newState) {
  if (currentState == newState) return; // Do nothing if the state hasn't changed.

  currentState = newState;
  stateChangeTime = millis(); // Record the time of the state change.

  Serial.print("Changing state to: ");

  switch(currentState) {
    case LOCKED:
      Serial.println("LOCKED");
      lockServo.write(LOCK_ANGLE_LOCKED);
      doorServo.write(DOOR_ANGLE_CLOSED);
      break;
    case UNLOCKED:
      Serial.println("UNLOCKED");
      lockServo.write(LOCK_ANGLE_UNLOCKED);
      break;
    case DOOR_OPEN:
      Serial.println("DOOR_OPEN");
      doorServo.write(DOOR_ANGLE_OPEN);
      break;
    case CLOSING:
      Serial.println("CLOSING");
      doorServo.write(DOOR_ANGLE_CLOSED);
      break;
  }
}

// Checks if a new RFID card is present.
bool isCardPresent() {
  return mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial();
}

// Checks if the presented card's UID is in the authorized list.
bool isCardAuthorized() {
  // Check if the UID matches either of the authorized cards.
  bool isAuth = (memcmp(mfrc522.uid.uidByte, authorizedUID1, mfrc522.uid.size) == 0 ||
                 memcmp(mfrc522.uid.uidByte, authorizedUID2, mfrc522.uid.size) == 0);

  mfrc522.PICC_HaltA(); // Stop reading the card to prevent multiple triggers.

  if (isAuth) {
    Serial.println("ACCESS GRANTED: Authorized card detected.");
    setState(UNLOCKED); // Change state to UNLOCKED.
  } else {
    Serial.println("ACCESS DENIED: Unauthorized card.");
  }
  return isAuth;
}

// Measures distance using the ultrasonic sensor.
int getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);
  
  long duration = pulseIn(ECHO_PIN, HIGH, 25000); // 25ms timeout
  
  if (duration == 0) return 999; // Return a large number if timeout occurs.
  
  // Calculate distance in cm
  return duration * 0.034 / 2;
}

// Checks if the laser beam is broken.
bool isLaserBeamBroken() {
  return analogRead(LDR_PIN) < LDR_THRESHOLD;
}

// Combines sensor checks to see if the doorway is obstructed.
bool isObstructionDetected() {
  if (getDistance() < DISTANCE_THRESHOLD) return true;
  if (isLaserBeamBroken()) return true;
  return false;
}