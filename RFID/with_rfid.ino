

#include <ESP32Servo.h>

#include <SPI.h>

#include <MFRC522.h>



// --- WiFi and MQTT Libraries ---

#include <WiFi.h>

#include <WiFiClientSecure.h>

#include <PubSubClient.h>

#include <ArduinoJson.h>


const char* WIFI_SSID = "YOUR_WIFI_SSID";

const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

const char* MQTT_SERVER = "0eda15dddf32497f9ef388722c4eaab7.s1.eu.hivemq.cloud";

const int MQTT_PORT = 8883;

const char* MQTT_USERNAME = "Thanhjash";

const char* MQTT_PASSWORD = "Hunter.j17";

const char* MQTT_STATUS_TOPIC = "security/door/status";

const char* MQTT_CONTROL_TOPIC = "security/door/control";

const char* MQTT_CERTIFICATE = R"EOF(

-----BEGIN CERTIFICATE-----

MIIFPDCCBCSgAwIBAgISBlvO6+BhAYoAodu3Tizj+vEDMA0GCSqGSIb3DQEBCwUA

MDMxCzAJBgNVBAYTAlVTMRYwFAYDVQQKEw1MZXQncyBFbmNyeXB0MQwwCgYDVQQD

EwNSMTEwHhcNMjUwNDIyMjA1OTMwWhcNMjUwNzIxMjA1OTI5WjAfMR0wGwYDVQQD

DBQqLnMxLmV1LmhpdmVtcS5jbG91ZDCCASIwDQYJKoZIhvcNAQEBBQADggEPADCC

AQoCggEBAKVuz2sMPmxx2w/f81/YAEKTbNZMJPk2+ooLFg5hxXvReF+AwIT4XvZ+

MLhSKvFxmghJF+BB9WyhqrcJLGDCP4s6SOLWTYixEoTcaLUviqqn+06kYqDJ6E83

NGsc7T42DlPnzqcZZjPRed9rt4CP3RgeZlWyYZgiD8FoJG9gie8ytihF/FkGZT8T

N4Vkl2vQa3mfBWeeKrcuhcLPxqIWDz/30iYfLtEe5JYYScoCKTXcP9SUStjpR8pD

vfOWdvasOAuBy7yBbx01/4lcQt50hfbhTR/K14/D4rNkuuvU7ktSQnoxVXC8YDwG

zkny10DFt65mVYLNZcBQtOLHHOZGV30CAwEAAaOCAlwwggJYMA4GA1UdDwEB/wQE

AwIFoDAdBgNVHSUEFjAUBggrBgEFBQcDAQYIKwYBBQUHAwIwDAYDVR0TAQH/BAIw

ADAdBgNVHQ4EFgQUgsEjDU35+EWJKBsFxJ0lM0PXMi4wHwYDVR0jBBgwFoAUxc9G

pOr0w8B6bJXELbBeki8m47kwVwYIKwBBQUHAQEESzBJMCIGCCsGAQUFBzABhhZo

dHRwOi8vcjExLm8ubGVuYyIub3JnMCMGCCsGAQUFBzAChhdodHRwOi8vcjExLmku

bGVuYyIub3JnLzAzBgNVHREELDAqghQqLnMxLmV1LmhpdmVtcS5jbG91ZIISczEu

ZXUuaGl2ZW1xLmNsb3VkMBMGA1UdIAQMMAowCAYGZ4EMAQIBMC0GA1UdHwQmMCQw

IqAgoB6GHGh0dHA6Ly9yMTEuYy5sZW5jci5vcmcvNC5jcmwwggEFBgorBgEEAdZ5

AgQCBIH2BIHzAPEAdgAN4fIwK9MNwUBiEgnqVS78R3R8sdfpMO8OQh60fk6qNAAA

AZZfgg0JAAAEAwBHMEUCIQCENUD4FWITFwnyxsOr4D54wR+LUgZyEjwMd+GwHiha

agIgOdeXyofPYtzl2DajwNvR+6XbCikAbbQvZTZ4Eahu2coAdwDM+w9qhXEJZf6V

m1PO6bJ8IumFXA2XjbapflTA/kwNsAAAAZZfghU/AAAEAwBIMEYCIQDu8/zVPYFl

bmd1vt5Fqk0sXJLV+MEFhQH75Kn6jlvtFgIhAOA8DAE1QBWXxmYSyFXw9UvC4EvH

4+VR1cA8merS5vl4MA0GCSqGSIb3DQEBCwUAA4IBAQBVET3hPDZX/protLVPy/vX

4i41k5J3teGokrEMu/TdMN6i/W7555Vsgl1zXj5a1f+4FsQ2Nfh1sDMuz/Djzgxp

M8HMifB5HJTX+slAuElLzlQFCxMVNn3+b4BgpxvwA3srrXGudF3cya0qztg5lNju

y6zAjYfxMQA0uHtCSuxKk033uFkeBv1ui3XWC1JcISbsoF47RVBp/a5O3kBr+j18

k5qL7dWcKWr2S9JctGCH4ezYNmAG9W6w/KoTHH3HJCWrTzziJutY48Rwt4gJcS1s

OSV8OT5pGKVpVnKSSOz4ItIaqis6fdetTiba38lUyzjDNklYL72Ye4Ck+qvjyc33

-----END CERTIFICATE-----

-----BEGIN CERTIFICATE-----

MIIFBjCCAu6gAwIBAgIRAIp9PhPWLzDvI4a9KQdrNPgwDQYJKoZIhvcNAQELBQAw

TzELMAkGA1UEBhMCVVMxKTAnBgNVBAoTIEludGVybmV0IFNlY3VyaXR5IFJlc2Vh

cmNoIEdyb3VwMRUwEwYDVQQDEwxJU1JHIFJvb3QgWDEwHhcNMjQwMzEzMDAwMDAw

WhcNMjcwMzEyMjM1OTU5WjAzMQswCQYDVQQGEwJVUzEWMBQGA1UEChMNTGV0J3Mg

RW5jcnlwdDEMMAoGA1UEAxMDUjExMIIBIjANBgkqhkiGw0BAQEFAAOCAQ8AMIIB

CgKCAQEAuoe8XBsAOcvKCs3UZxD5ATylTqVhyybKUvsVAbe5KPUoHu0nsyQYOWcJ

DAjs4DqwO3cOvfPlOVRBDE6uQdaZdN5R2+97/i1gLcT9t4x1fJyyXJqC4N0lZxG

AGQUmfOx2SLZzaiSqhwmej/+71gFewiVgdtxD4774zEJuwm+UE1fj5F2PVqdnoPy

6cRms+EGZkNIGIBloDcYmpuEMpexsr3E+BUAnSeI++JjF5ZsmydnS8TbKF5pwnnw

SVzgJFDhxLyhBax7QG0AtMJBP6dYuC/FXJuluwme8f7rsIU5/agK70XEeOtlKsLP

Xzze41xNG/cLJyuqC0J3U095ah2H2QIDAQABo4H4MIH1MA4GA1UdDwEB/wQEAwIB

hjAdBgNVHSUEFjAUBggrBgEFBQcDAgYIKwYBBQUHAwEwEgYDVR0TAQH/BAgwBgEB

/wIBADAdBgNVHQ4EFgQUxc9GpOr0w8B6bJXELbBeki8m47kwHwYDVR0jBBgwFoAU

ebRZ5nu25eQBc4AIiMgaWPbpm24wMgYIKwYBBQUHAQEEJjAkMCIGCCsGAQUFBzAC

hhZodHRwOi8veDEuaS5sZW5jci5vcmcvMBMGA1UdIAQMMAowCAYGZ4EMAQIBMCcG

A1UdHwQgMB4wHKAaoBiGFmh0dHA6Ly94MS5jLmxlbmNyLm9yZy8wDQYJKoZIhvcN

AQELBQADggIBAE7iiV0KAxyQOND1H/lxXPjDj7I3iHpvsCUf7b632IYGjukJhM1y

v4Hz/MrPU0jtvfZpQtSlET41yBOykh0FX+ou1Nj4ScOt9ZmWnO8m2OG0JAtIIE38

01S0qcYhyOE2G/93ZCkXufBL713qzXnQv5C/viOykNpKqUgxdKlEC+Hi9i2DcaR1

e9KUwQUZRhy5j/PEdEglKg3l9dtD4tuTm7kZtB8v32oOjzHTYw+7KdzdZiw/sBtn

UfhBPORNuay4pJxmY/WrhSMdzFO2q3Gu3MUBcdo27goYKjL9CTF8j/Zz55yctUoV

aneCWs/ajUX+HypkBTA+c8LGDLnWO2NKq0YD/pnARkAnYGPfUDoHR9gVSp/qRx+Z

WghiDLZsMwhN1zjtSC0uBWiugF3vTNzYIEFfaPG7Ws3jDrAMMYebQ95JQ+HIBD/R

PBuHRTBpqKlyDnkSHDHYPiNX3adPoPAcgdF3H2/W0rmoswMWgTlLn1Wu0mrks7/q

pdWfS6PJ1jty80r2VKsM/Dj3YIDfbjXKdaFU5C+8bhfJGqU3taKauuz0wHVGT3eo

6FlWkWYtbt4pgdamlwVeZEW+LM7qZEJEsMNPrfC03APKmZsJgpWCDWOKZvkZcvjV

uYkQ4omYCTX5ohy+knMjdOmdH9c7SpqEWBDC86fiNex+O0XOMEZSa8DA

-----END CERTIFICATE-----

)EOF";



// =========================================================================

// PIN DEFINITIONS AND DEVICE SETUP

// =========================================================================

const int CUSTOM_MOSI_PIN = 11;

const int CUSTOM_MISO_PIN = 12;

const int CUSTOM_SCK_PIN  = 13;

const int TRIG_PIN = 5;

const int ECHO_PIN = 6;

const int DOOR_SERVO_PIN = 8;

const int LOCK_SERVO_PIN = 7;

const int LASER_PIN = 2;

const int SS_PIN = 10;

const int RST_PIN = 9;

const int LDR_PIN = 4;

const int LOCK_ANGLE_LOCKED = 100;

const int LOCK_ANGLE_UNLOCKED = 0;

const int DOOR_ANGLE_CLOSED = 80;

const int DOOR_ANGLE_OPEN = 140;

const unsigned long UNLOCK_TIMEOUT = 10000;

const unsigned long DOOR_CLOSE_DELAY = 1500;

const unsigned long CLOSING_GRACE_PERIOD = 500;

const int DISTANCE_THRESHOLD = 25;

const int LDR_THRESHOLD = 500;



Servo doorServo;

Servo lockServo;

MFRC522 mfrc522(SS_PIN, RST_PIN);

WiFiClientSecure espClient;

PubSubClient client(espClient);



enum State { LOCKED, UNLOCKED, DOOR_OPEN, CLOSING };

State currentState = LOCKED;

unsigned long stateChangeTime = 0;

unsigned long lastPublishTime = 0;



byte authorizedUID1[4] = {0x17, 0x37, 0x06, 0xD8};

byte authorizedUID2[4] = {0x1C, 0x0C, 0x0D, 0x22};
void publishStatus(const char* trigger = nullptr, const char* uid = nullptr);

void setState(State newState, const char* trigger = nullptr, const char* uid = nullptr);

void setup_wifi() {

  delay(10);

  Serial.println();

  Serial.print("Connecting to ");

  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);

    Serial.print(".");

  }

  Serial.println("\nWiFi connected");

  Serial.print("IP address: ");

  Serial.println(WiFi.localIP());

}



void callback(char* topic, byte* payload, unsigned int length) {

  Serial.print("Message received on topic: ");

  Serial.println(topic);



  StaticJsonDocument<128> doc;

  deserializeJson(doc, payload, length);



  const char* command = doc["command"];



  if (strcmp(command, "UNLOCK") == 0) {

    if (currentState == LOCKED) {

      setState(UNLOCKED, "REMOTE_UNLOCK");

    }

  } else if (strcmp(command, "LOCK") == 0) {

    if (currentState != LOCKED) {

      setState(LOCKED, "REMOTE_LOCK");

    }

  }

}



void reconnect() {

  while (!client.connected()) {

    Serial.print("Attempting MQTT connection...");

    String clientId = "ESP32-SecurityDoor-"; 

    clientId += String(random(0xffff), HEX);

    if (client.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {

      Serial.println("connected");

      client.subscribe(MQTT_CONTROL_TOPIC);

      publishStatus("RECONNECT");

    } else {

      Serial.print("failed, rc=");

      Serial.print(client.state());

      Serial.println(" try again in 5 seconds");

      delay(5000);

    }

  }

}



void publishStatus(const char* trigger, const char* uid) {

  if (!client.connected()) return;



  StaticJsonDocument<256> doc;

 

  String stateStr = "UNKNOWN";

  switch(currentState) {

    case LOCKED:    stateStr = "LOCKED";    break;

    case UNLOCKED:  stateStr = "UNLOCKED";  break;

    case DOOR_OPEN: stateStr = "DOOR_OPEN"; break;

    case CLOSING:   stateStr = "CLOSING";   break;

  }



  doc["state"] = stateStr;

  doc["distance"] = getDistance();

  doc["laserBroken"] = isLaserBeamBroken();

  if (trigger) {

    doc["trigger"] = trigger;

  }

  if (uid) {

    doc["uid"] = uid;

  }

 

  char buffer[256];

  serializeJson(doc, buffer);

  client.publish(MQTT_STATUS_TOPIC, buffer);

}



// =========================================================================

// SETUP

// =========================================================================

void setup() {

  Serial.begin(115200);

  Serial.println("\nSmart Door Security System Initializing...");



  pinMode(TRIG_PIN, OUTPUT);

  pinMode(ECHO_PIN, INPUT);

  pinMode(LDR_PIN, INPUT);

  pinMode(LASER_PIN, OUTPUT);

  digitalWrite(LASER_PIN, HIGH);

  doorServo.attach(DOOR_SERVO_PIN);

  lockServo.attach(LOCK_SERVO_PIN);

  SPI.begin(CUSTOM_SCK_PIN, CUSTOM_MISO_PIN, CUSTOM_MOSI_PIN, -1);

  mfrc522.PCD_Init();



  setup_wifi();

  espClient.setCACert(MQTT_CERTIFICATE);

  client.setServer(MQTT_SERVER, MQTT_PORT);

  client.setCallback(callback);



  setState(LOCKED, "BOOT");

  Serial.println("System is LOCKED. Please scan a valid card.");

}
void loop() {

  if (!client.connected()) reconnect();

  client.loop();



  switch (currentState) {

    case LOCKED:

      if (isCardPresent() && isCardAuthorized()) {

        // isCardAuthorized now calls setState

      }

      break;

    case UNLOCKED:

      if (getDistance() < DISTANCE_THRESHOLD) {

        setState(DOOR_OPEN);

      } else if (millis() - stateChangeTime > UNLOCK_TIMEOUT) {

        setState(LOCKED, "TIMEOUT");

      }

      break;

    case DOOR_OPEN:

      if (!isObstructionDetected()) {

        setState(CLOSING);

      }

      break;

    case CLOSING:

      if (millis() - stateChangeTime > CLOSING_GRACE_PERIOD) {

        if (isObstructionDetected()) {

          setState(DOOR_OPEN, "OBSTRUCTION");

          break;

        }

      }

      if (millis() - stateChangeTime > DOOR_CLOSE_DELAY) {

        setState(LOCKED);

      }

      break;

  }



  if (millis() - lastPublishTime > 30000) { // Publish a heartbeat status every 30s

    publishStatus("HEARTBEAT");

    lastPublishTime = millis();

  }

}



void setup_wifi() {

  delay(10);

  Serial.println();

  Serial.print("Connecting to ");

  Serial.println(WIFI_SSID);

  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  while (WiFi.status() != WL_CONNECTED) {

    delay(500);

    Serial.print(".");

  }



Not connected. Select a board and a port to connect automatically.

No Line Ending





// =========================================================================

// HELPER FUNCTIONS

// =========================================================================

void setState(State newState, const char* trigger, const char* uid) {

  if (currentState == newState) return;



  currentState = newState;

  stateChangeTime = millis();



  switch(currentState) {

    case LOCKED:

      lockServo.write(LOCK_ANGLE_LOCKED);

      doorServo.write(DOOR_ANGLE_CLOSED);

      break;

    case UNLOCKED:

      lockServo.write(LOCK_ANGLE_UNLOCKED);

      break;

    case DOOR_OPEN:

      doorServo.write(DOOR_ANGLE_OPEN);

      break;

    case CLOSING:

      doorServo.write(DOOR_ANGLE_CLOSED);

      break;

  }

 

  publishStatus(trigger, uid);

}



bool isCardPresent() {

  return mfrc522.PICC_IsNewCardPresent() && mfrc522.PICC_ReadCardSerial();

}



bool isCardAuthorized() {

  String uidStr = "";

  for (byte i = 0; i < mfrc522.uid.size; i++) {

    uidStr += (mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " ");

    uidStr += String(mfrc522.uid.uidByte[i], HEX);

  }

  uidStr.trim();

  uidStr.toUpperCase();



  bool isAuth = (memcmp(mfrc522.uid.uidByte, authorizedUID1, mfrc522.uid.size) == 0 ||

                 memcmp(mfrc522.uid.uidByte, authorizedUID2, mfrc522.uid.size) == 0);



  mfrc522.PICC_HaltA();



  if (isAuth) {

    setState(UNLOCKED, "RFID", uidStr.c_str());

  } else {

    Serial.println("ACCESS DENIED: Unauthorized card.");

  }

  return isAuth;

}



int getDistance() {

  digitalWrite(TRIG_PIN, LOW);

  delayMicroseconds(2);

  digitalWrite(TRIG_PIN, HIGH);

  delayMicroseconds(10);

  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 25000);

  if (duration == 0) return 999;

  return duration * 0.034 / 2;

}



bool isLaserBeamBroken() {

  return analogRead(LDR_PIN) < LDR_THRESHOLD;

}



bool isObstructionDetected() {

  if (getDistance() < DISTANCE_THRESHOLD) return true;

  if (isLaserBeamBroken()) return true;

  return false;

}

