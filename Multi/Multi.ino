#include "arduino_secrets.h"
#include <MQ135.h>
#include <MQUnifiedsensor.h>
#include <DHT.h>
#include <Wire.h>
#include <BH1750.h>
#include <PubSubClient.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

#define RZERO 206.85
#define RL_VALUE (1)
#define RO_CLEAN_AIR_FACTOR (9.83)
#define CALIBARAION_SAMPLE_TIMES (50)
#define CALIBRATION_SAMPLE_INTERVAL (500)
#define READ_SAMPLE_INTERVAL (50)
#define READ_SAMPLE_TIMES (5)
#define GAS_SMOKE (2)
float SmokeCurve[3] ={2.3,0.53,-0.44};
float Ro2 = 10;

#define DHTPIN 18
#define DHTTYPE DHT11
#define Board "YD-ESP32-WROOM-1"
#define Voltage_Resolution 3.3
#define ADC_Bit_Resolution 12
#define RatioMQ135CleanAir 3.6
#define RatioMQ2CleanAir 9.83
#define MQ_PIN 10

// Pin definitions
const int mq135Pin = 3;
const int mq2Pin = 10;
const int flamePin = 2;
const int buzzerPin = 11;
const int ledPin = 12;
const int motorPin1 = 4;
const int motorPin2 = 5;
const int motorEnA = 6;
const int motorPin3 = 35;
const int motorPin4 = 36;
const int motorEnB = 37;

// Thresholds for sensors
struct Thresholds {
  float temperature;
  float humidity;
  float co2;
  float light;
  float co;      // Carbon monoxide
  float lpg;     // Liquid petroleum gas
  float smoke;   // Smoke density
  float nh3;     // Ammonia
};

// Device state structure
struct DeviceState {
  bool ledState;
  bool buzzerState;
  int motorASpeed;   // Ventilation
  int motorBSpeed;   // Fan
  bool autoMode;
  bool emergencyMode;
  unsigned long lastEmergencyTime;  // Time when emergency mode was activated
};

// Manual control flags
struct ManualControl {
  bool led;
  bool motorA;
  bool motorB;
  bool buzzer;
};

// Default thresholds
Thresholds thresholds = {30, 60, 1000, 500, 50, 500, 100, 10};

// Initialize device state
DeviceState currentState = {false, false, 0, 0, true, false, 0};
ManualControl manualControl = {false, false, false, false};

// Initialize sensors
DHT dht(DHTPIN, DHTTYPE);
BH1750 lightMeter;
MQUnifiedsensor mq135(Board, Voltage_Resolution, ADC_Bit_Resolution, mq135Pin, "MQ-135");
MQUnifiedsensor mq2(Board, Voltage_Resolution, ADC_Bit_Resolution, mq2Pin, "MQ-2");
MQ135 MQ135(mq135Pin);

// Sensor data variables
float temperature = 0;
float humidity = 0;
float co2 = 0;
float lpg = 0;
float co = 0;
float smoke = 0;
float nh3 = 0;
float light = 0;
bool Flame = false;

// WiFi and MQTT configuration
const char* ssid = "VGU_Student_Guest";
const char* password = "";
const char* mqtt_server = "0eda15dddf32497f9ef388722c4eaab7.s1.eu.hivemq.cloud";
const int mqtt_port = 8883;
const char* mqtt_username = "Thanhjash";
const char* mqtt_password = "Hunter.j17";
const char* device_id = "default";  // Default device ID for MQTT topics

WiFiClientSecure espClient;
PubSubClient client(espClient);

// Certificate chain from OpenSSL
const char* mqtt_certificate = R"EOF(
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
pOr0w8B6bJXELbBeki8m47kwVwYIKwYBBQUHAQEESzBJMCIGCCsGAQUFBzABhhZo
dHRwOi8vcjExLm8ubGVuY3Iub3JnMCMGCCsGAQUFBzAChhdodHRwOi8vcjExLmku
bGVuY3Iub3JnLzAzBgNVHREELDAqghQqLnMxLmV1LmhpdmVtcS5jbG91ZIISczEu
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
RW5jcnlwdDEMMAoGA1UEAxMDUjExMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIB
CgKCAQEAuoe8XBsAOcvKCs3UZxD5ATylTqVhyybKUvsVAbe5KPUoHu0nsyQYOWcJ
DAjs4DqwO3cOvfPlOVRBDE6uQdaZdN5R2+97/1i9qLcT9t4x1fJyyXJqC4N0lZxG
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

// Timing variables
unsigned long lastPublish = 0;
const long publishInterval = 5000;  // 5 seconds between sensor data publishing

unsigned long lastReadSensors = 0;
const long readSensorInterval = 1000;  // 1 second between sensor readings

unsigned long lastConnectionCheck = 0;
const unsigned long connectionCheckInterval = 30000;  // 30 seconds between connection checks

unsigned long lastCommandReceived = 0;
const unsigned long commandTimeout = 300000;  // 5 minutes - max time without commands before sync request

unsigned long lastOfflineAutoMode = 0;
const unsigned long offlineAutoModeInterval = 10000;  // 10 seconds - interval for offline auto mode

// Emergency exit delay - to prevent rapid toggling
const unsigned long EMERGENCY_EXIT_DELAY = 30000;  // 30 seconds before exiting emergency mode

// Connection status
bool mqttConnected = false;

// Setup WiFi connection
void setup_wifi() {
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

// Connect to MQTT broker
void reconnect() {
  int attempts = 0;
  while (!client.connected() && attempts < 5) {
    attempts++;
    Serial.print("Attempting MQTT connection... (");
    Serial.print(attempts);
    Serial.print("/5) ");
    
    String clientId = "ESP32Client-";
    clientId += String(random(0xffff), HEX);
    
    if (client.connect(clientId.c_str(), mqtt_username, mqtt_password)) {
      Serial.println("connected");
      mqttConnected = true;
      
      // Subscribe to topics
      client.subscribe("home/control");
      client.subscribe("home/thresholds");
      client.subscribe("home/sync_request");
      client.subscribe("home/reset_manual");
      
      // Publish current status after connection
      publishDeviceStatus();
      
      // Publish emergency state if active
      if (currentState.emergencyMode) {
        client.publish("home/emergency", "true");
      }
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      Serial.println(" trying again in 5 seconds");
      mqttConnected = false;
      delay(5000);
    }
  }
  
  if (!client.connected()) {
    Serial.println("Failed to connect to MQTT broker after multiple attempts");
    Serial.println("Continuing in offline mode");
    mqttConnected = false;
  }
}

// Send command confirmation with device state
void sendConfirmation(const char* requestId, bool success, const char* errorMsg = NULL) {
  if (!requestId || !mqttConnected) return;
  
  char topic[50];
  snprintf(topic, sizeof(topic), "home/confirm/%s", requestId);
  
  StaticJsonDocument<256> confirmDoc;
  confirmDoc["success"] = success;
  if (!success && errorMsg != NULL) {
    confirmDoc["message"] = errorMsg;
  }
  
  // Include current device state
  confirmDoc["led"] = currentState.ledState;
  confirmDoc["buzzer"] = currentState.buzzerState;
  confirmDoc["motorA"] = currentState.motorASpeed;
  confirmDoc["motorB"] = currentState.motorBSpeed;
  confirmDoc["autoMode"] = currentState.autoMode;
  confirmDoc["emergencyMode"] = currentState.emergencyMode;
  
  // Include manual control flags
  confirmDoc["manualLed"] = manualControl.led;
  confirmDoc["manualMotorA"] = manualControl.motorA;
  confirmDoc["manualMotorB"] = manualControl.motorB;
  confirmDoc["manualBuzzer"] = manualControl.buzzer;
  
  char buffer[256];
  serializeJson(confirmDoc, buffer);
  
  if (client.publish(topic, buffer)) {
    Serial.print("Confirmation sent to topic: ");
    Serial.println(topic);
  } else {
    Serial.print("Failed to send confirmation to topic: ");
    Serial.println(topic);
  }
}

// Publish sensor data
void publishSensorData() {
  if (!mqttConnected) return;
  
  StaticJsonDocument<256> doc;
  doc["temperature"] = temperature;
  doc["humidity"] = humidity;
  doc["co2"] = co2;
  doc["lpg"] = lpg;
  doc["co"] = co;
  doc["smoke"] = smoke;
  doc["nh3"] = nh3;
  doc["light"] = light;
  doc["flame"] = Flame;
  doc["deviceId"] = device_id;

  char buffer[256];
  serializeJson(doc, buffer);
  if (!client.publish("home/sensors", buffer)) {
    Serial.println("Failed to publish sensor data");
  }
}

// Publish device status
void publishDeviceStatus() {
  if (!mqttConnected) return;
  
  StaticJsonDocument<256> doc;
  doc["led"] = currentState.ledState;
  doc["buzzer"] = currentState.buzzerState;
  doc["motorA"] = currentState.motorASpeed;
  doc["motorB"] = currentState.motorBSpeed;
  doc["autoMode"] = currentState.autoMode;
  doc["emergencyMode"] = currentState.emergencyMode;
  doc["deviceId"] = device_id;
  
  // Include manual control flags
  doc["manualLed"] = manualControl.led;
  doc["manualMotorA"] = manualControl.motorA;
  doc["manualMotorB"] = manualControl.motorB;
  doc["manualBuzzer"] = manualControl.buzzer;

  char buffer[256];
  serializeJson(doc, buffer);
  if (client.publish("home/device_status", buffer)) {
    Serial.println("Device status published successfully");
  } else {
    Serial.println("Failed to publish device status");
  }
}

// Device control functions
void setMotorA(int speed, bool isManual = false) {
  // Ensure valid value
  speed = constrain(speed, 0, 255);
  
  analogWrite(motorEnA, speed);
  digitalWrite(motorPin1, speed > 0 ? HIGH : LOW);
  digitalWrite(motorPin2, speed > 0 ? LOW : HIGH);
  currentState.motorASpeed = speed;
  
  if (isManual) {
    manualControl.motorA = true;
  }
}

void setMotorB(int speed, bool isManual = false) {
  // Ensure valid value
  speed = constrain(speed, 0, 255);
  
  analogWrite(motorEnB, speed);
  digitalWrite(motorPin3, speed > 0 ? HIGH : LOW);
  digitalWrite(motorPin4, speed > 0 ? LOW : HIGH);
  currentState.motorBSpeed = speed;
  
  if (isManual) {
    manualControl.motorB = true;
  }
}

void setLed(bool state, bool isManual = false) {
  digitalWrite(ledPin, state ? HIGH : LOW);
  currentState.ledState = state;
  
  if (isManual) {
    manualControl.led = true;
  }
}

void setBuzzer(bool state, bool isManual = false) {
  digitalWrite(buzzerPin, state ? HIGH : LOW);
  currentState.buzzerState = state;
  
  if (isManual) {
    manualControl.buzzer = true;
  }
}

// Reset manual control flags
void resetManualControl() {
  manualControl = {false, false, false, false};
  Serial.println("Manual control flags reset");
}

// EMERGENCY MODE HANDLING - DIRECT ON ARDUINO
// Check if emergency conditions are met
bool checkEmergencyCondition() {
  return Flame || 
         co > thresholds.co || 
         lpg > thresholds.lpg || 
         smoke > thresholds.smoke || 
         nh3 > thresholds.nh3;
}

// Check and handle emergency state
void checkEmergency() {
  bool isEmergency = checkEmergencyCondition();
  
  // Enter emergency mode if conditions met
  if (isEmergency && !currentState.emergencyMode) {
    handleEmergency();
  } 
  // Exit emergency mode after delay if conditions cleared
  else if (!isEmergency && currentState.emergencyMode) {
    // Only exit if conditions have been clear for the specified delay
    if (millis() - currentState.lastEmergencyTime > EMERGENCY_EXIT_DELAY) {
      disableEmergency();
    }
  }
  // If still in emergency, update the timestamp regularly to prevent premature exit
  else if (isEmergency && currentState.emergencyMode) {
    currentState.lastEmergencyTime = millis();
  }
}

// Handle emergency activation
void handleEmergency() {
  Serial.println("EMERGENCY MODE ACTIVATED!");
  currentState.emergencyMode = true;
  currentState.lastEmergencyTime = millis();
  
  // Emergency actions
  setMotorA(255);  // Max ventilation
  setMotorB(0);    // Stop fan to prevent spreading fire/smoke
  setLed(true);    // Enable warning light
  setBuzzer(true); // Enable alarm
  
  // Notify backend if connected
  if (mqttConnected) {
    client.publish("home/emergency", "true");
  }
}

// Handle emergency deactivation
void disableEmergency() {
  Serial.println("Emergency mode disabled");
  currentState.emergencyMode = false;
  
  // Stop alarm
  setBuzzer(false);
  
  // Notify backend if connected
  if (mqttConnected) {
    client.publish("home/emergency", "false");
  }
  
  // Backend will handle device states after emergency
  // DO NOT auto-process settings here
}

// OFFLINE AUTO MODE - ONLY WHEN DISCONNECTED
void processOfflineAutoMode() {
  // Skip if any of these conditions is true:
  // 1. MQTT is connected
  // 2. In emergency mode
  // 3. Auto mode is disabled
  if (mqttConnected || currentState.emergencyMode || !currentState.autoMode) {
    return;
  }
  
  Serial.println("Processing offline auto mode");
  
  // In offline mode, auto mode overrides manual controls for safety
  
  // Fan (motorB) based on temperature/humidity
  if (temperature > thresholds.temperature || humidity > thresholds.humidity) {
    setMotorB(255);
  } else {
    setMotorB(0);
  }

  // Ventilation (motorA) based on CO2
  if (co2 > thresholds.co2) {
    setMotorA(255);
  } else if (co2 > thresholds.co2 * 0.75) {  // 75% of threshold
    setMotorA(155);
  } else {
    setMotorA(0);
  }

  // LED based on light level
  setLed(light < thresholds.light);
}

// MQTT message handler
void callback(char* topic, byte* payload, unsigned int length) {
  // Convert payload to string for logging
  char message[length + 1];
  memcpy(message, payload, length);
  message[length] = '\0';
  Serial.print("Message received on topic: ");
  Serial.println(topic);
  
  // Update last command time
  lastCommandReceived = millis();
  
  // Parse JSON payload
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, payload, length);
  
  if (error) {
    Serial.print("JSON parsing error: ");
    Serial.println(error.c_str());
    return;
  }
  
  // Extract requestId if present
  const char* requestId = NULL;
  if (doc.containsKey("requestId")) {
    requestId = doc["requestId"];
  }
  
  // Handle device control commands
  if (strcmp(topic, "home/control") == 0) {
    bool success = true;
    const char* errorMsg = NULL;
    
    // Check required fields
    if (!doc.containsKey("device")) {
      Serial.println("Error: Missing 'device' field");
      if (requestId) sendConfirmation(requestId, false, "Missing device field");
      return;
    }
    
    if (!doc.containsKey("state")) {
      Serial.println("Error: Missing 'state' field");
      if (requestId) sendConfirmation(requestId, false, "Missing state field");
      return;
    }
    
    const char* device = doc["device"];
    
    // Reject commands in emergency mode (except buzzer)
    if (currentState.emergencyMode && strcmp(device, "buzzer") != 0) {
      Serial.println("Command rejected: Emergency mode active");
      if (requestId) sendConfirmation(requestId, false, "Device in emergency mode");
      return;
    }
    
    // Process based on device type
    if (strcmp(device, "led") == 0) {
      if (doc["state"].is<bool>()) {
        setLed(doc["state"].as<bool>(), true);
      } else {
        success = false;
        errorMsg = "Invalid LED state value";
      }
    } else if (strcmp(device, "motorA") == 0) {
      if (doc["state"].is<int>()) {
        setMotorA(doc["state"].as<int>(), true);
      } else {
        success = false;
        errorMsg = "Invalid motorA value";
      }
    } else if (strcmp(device, "motorB") == 0) {
      if (doc["state"].is<int>()) {
        setMotorB(doc["state"].as<int>(), true);
      } else {
        success = false;
        errorMsg = "Invalid motorB value";
      }
    } else if (strcmp(device, "buzzer") == 0) {
      if (doc["state"].is<bool>()) {
        setBuzzer(doc["state"].as<bool>(), true);
      } else {
        success = false;
        errorMsg = "Invalid buzzer state value";
      }
    } else if (strcmp(device, "autoMode") == 0) {
      if (doc["state"].is<bool>()) {
        currentState.autoMode = doc["state"].as<bool>();
        Serial.print("Auto mode set to: ");
        Serial.println(currentState.autoMode);
        
        // Reset manual flags when auto mode is enabled
        if (currentState.autoMode) {
          resetManualControl();
        }
      } else {
        success = false;
        errorMsg = "Invalid autoMode value";
      }
    } else {
      success = false;
      errorMsg = "Unknown device";
    }
    
    // Send confirmation if requestId provided
    if (requestId) {
      sendConfirmation(requestId, success, errorMsg);
    }
    
    // Always publish updated device status
    publishDeviceStatus();
  } 
  // Handle threshold updates
  else if (strcmp(topic, "home/thresholds") == 0) {
    // Update thresholds
    if (doc.containsKey("temperature")) thresholds.temperature = doc["temperature"];
    if (doc.containsKey("humidity")) thresholds.humidity = doc["humidity"];
    if (doc.containsKey("co2")) thresholds.co2 = doc["co2"];
    if (doc.containsKey("light")) thresholds.light = doc["light"];
    if (doc.containsKey("co")) thresholds.co = doc["co"];
    if (doc.containsKey("lpg")) thresholds.lpg = doc["lpg"];
    if (doc.containsKey("smoke")) thresholds.smoke = doc["smoke"];
    if (doc.containsKey("nh3")) thresholds.nh3 = doc["nh3"];
    
    Serial.println("Thresholds updated");
    
    // Send confirmation if requestId provided
    if (requestId) {
      sendConfirmation(requestId, true);
    }
  }
  // Handle sync requests
  else if (strcmp(topic, "home/sync_request") == 0) {
    Serial.println("Sync request received");
    
    // Publish current device status
    publishDeviceStatus();
    
    // Send detailed sync response if requestId provided
    if (requestId) {
      char syncTopic[50];
      snprintf(syncTopic, sizeof(syncTopic), "home/sync_response");
      
      StaticJsonDocument<256> syncResponse;
      syncResponse["requestId"] = requestId;
      syncResponse["led"] = currentState.ledState;
      syncResponse["buzzer"] = currentState.buzzerState;
      syncResponse["motorA"] = currentState.motorASpeed;
      syncResponse["motorB"] = currentState.motorBSpeed;
      syncResponse["autoMode"] = currentState.autoMode;
      syncResponse["emergencyMode"] = currentState.emergencyMode;
      syncResponse["manualLed"] = manualControl.led;
      syncResponse["manualMotorA"] = manualControl.motorA;
      syncResponse["manualMotorB"] = manualControl.motorB;
      syncResponse["manualBuzzer"] = manualControl.buzzer;
      syncResponse["deviceId"] = device_id;
      
      char buffer[256];
      serializeJson(syncResponse, buffer);
      
      if (client.publish(syncTopic, buffer)) {
        Serial.print("Sync response sent to topic: ");
        Serial.println(syncTopic);
      } else {
        Serial.print("Failed to send sync response");
      }
    }
  }
  // Handle manual control reset
  else if (strcmp(topic, "home/reset_manual") == 0) {
    resetManualControl();
    
    // Send confirmation if requestId provided
    if (requestId) {
      sendConfirmation(requestId, true);
    }
    
    // Publish updated device status
    publishDeviceStatus();
  }
}

// Handle MQTT disconnection
void handleMqttDisconnection() {
  Serial.println("MQTT disconnected - operating in offline mode");
  mqttConnected = false;
}

// Read values from all sensors
void readSensors() {
  // Read temperature and humidity
  float newHumidity = dht.readHumidity();
  float newTemperature = dht.readTemperature();
  
  // Only update if readings are valid
  if (!isnan(newHumidity)) {
    humidity = newHumidity;
  }
  if (!isnan(newTemperature)) {
    temperature = newTemperature;
  }
  
  // Update gas sensors
  mq135.update();
  mq2.update();

  smoke = MQGetGasPercentage(MQRead(MQ_PIN) / Ro2, GAS_SMOKE);

  mq2.setA(574.25); mq2.setB(-2.222);
  lpg = mq2.readSensor();

  mq2.setA(36974); mq2.setB(-3.109);
  co = mq2.readSensor();

  mq135.setA(110.47); mq135.setB(-2.862);    
  co2 = mq135.readSensor();

  mq135.setA(102.2); mq135.setB(-2.473);    
  nh3 = mq135.readSensor();

  // Read light level
  float newLight = lightMeter.readLightLevel();
  if (newLight >= 0) {  // Valid reading
    light = newLight;
  }

  // Read flame sensor
  Flame = (digitalRead(flamePin) == HIGH);
}

// Arduino setup function
void setup() {
  Serial.begin(9600);
  
  // Initialize pins
  pinMode(mq135Pin, INPUT);
  pinMode(mq2Pin, INPUT);
  pinMode(flamePin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  pinMode(motorPin1, OUTPUT);
  pinMode(motorPin2, OUTPUT);
  pinMode(motorEnA, OUTPUT);
  pinMode(motorPin3, OUTPUT);
  pinMode(motorPin4, OUTPUT);
  pinMode(motorEnB, OUTPUT);
  pinMode(ledPin, OUTPUT);
  
  // Initialize devices to off state
  digitalWrite(buzzerPin, LOW);
  digitalWrite(ledPin, LOW);
  analogWrite(motorEnA, 0);
  analogWrite(motorEnB, 0);
  
  // Initialize sensors
  Wire.begin(8, 9);
  dht.begin();
  
  // Initialize gas sensors
  mq135.init();
  mq135.setRegressionMethod(1); 
  mq2.init();
  mq2.setRegressionMethod(1);
  
  // Initialize light sensor
  if (lightMeter.begin(BH1750::CONTINUOUS_HIGH_RES_MODE)) {
    Serial.println("BH1750 sensor initialized");
  } else {
    Serial.println("Error initializing BH1750 sensor");
  }
  
  // Setup WiFi connection
  setup_wifi();
  
  // Configure SSL/TLS
  espClient.setCACert(mqtt_certificate);
  
  // Configure MQTT
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(callback);
  
  // Calibrate gas sensors
  Serial.println("Calibrating sensors...");
  float calcR0 = 0;
  float calcR02 = 0;
  for(int i = 1; i <= 10; i++) {
    mq135.update();
    mq2.update();
    calcR0 += mq135.calibrate(RatioMQ135CleanAir);
    calcR02 += mq2.calibrate(RatioMQ2CleanAir);
    Serial.print(".");
    delay(500);
  }             
  
  Ro2 = MQCalibration(MQ_PIN);
  
  Serial.print("Calibration complete. Ro2=");
  Serial.print(Ro2);
  Serial.println("kohm");
  
  mq135.setR0(calcR0 / 10);
  mq2.setR0(calcR02 / 10);
  
  // Check for sensor issues
  if (isinf(calcR0) || calcR0 == 0 || isinf(calcR02) || calcR02 == 0) {
    Serial.println("Warning: Sensor connection issue detected");
  }
  
  // Connect to MQTT broker
  if (!client.connected()) {
    reconnect();
  }
  
  // Initialize random seed
  randomSeed(micros());
  
  // Initialize timestamps
  lastCommandReceived = millis();
  lastOfflineAutoMode = millis();
  lastReadSensors = millis();
  lastPublish = millis();
  
  Serial.println("Setup complete");
}

// Arduino main loop
void loop() {
  unsigned long now = millis();
  
  // Check MQTT connection status periodically
  if (now - lastConnectionCheck > connectionCheckInterval) {
    lastConnectionCheck = now;
    
    if (mqttConnected && !client.connected()) {
      handleMqttDisconnection();
    }
  }
  
  // Try to reconnect to MQTT if disconnected
  if (!client.connected()) {
    reconnect();
  }
  
  // Process MQTT messages
  client.loop();
  
  // Read sensors periodically
  if (now - lastReadSensors > readSensorInterval) {
    lastReadSensors = now;
    readSensors();
    
    // Check for emergency conditions after each sensor read
    checkEmergency();
  }
  
  // Process offline auto mode if disconnected
  if (!mqttConnected && now - lastOfflineAutoMode > offlineAutoModeInterval) {
    lastOfflineAutoMode = now;
    processOfflineAutoMode();
  }
  
  // Request sync if no commands received for a long time
  if (mqttConnected && now - lastCommandReceived > commandTimeout) {
    lastCommandReceived = now;
    
    StaticJsonDocument<100> syncDoc;
    syncDoc["requestId"] = "timeout-sync";
    char buffer[100];
    serializeJson(syncDoc, buffer);
    
    Serial.println("Command timeout - requesting sync from backend");
    client.publish("home/sync_request", buffer);
  }
  
  // Publish sensor data and device status periodically
  if (now - lastPublish > publishInterval) {
    lastPublish = now;
    if (mqttConnected) {
      publishSensorData();
      publishDeviceStatus();
    }
  }
  
  delay(50);  // Small delay to reduce CPU usage
}

// Gas sensor helper functions
float MQResistanceCalculation(int raw_adc) {
  return ((float)RL_VALUE*(1023-raw_adc)/raw_adc);
}
 
float MQCalibration(int mq_pin) {
  int i;
  float val=0;
 
  for (i=0; i<CALIBARAION_SAMPLE_TIMES; i++) {
    val += MQResistanceCalculation(analogRead(mq_pin));
    delay(CALIBRATION_SAMPLE_INTERVAL);
  }
  val = val/CALIBARAION_SAMPLE_TIMES;
  val = val/RO_CLEAN_AIR_FACTOR;
  return val; 
}

float MQRead(int mq_pin) {
  int i;
  float rs=0;
 
  for (i=0; i<READ_SAMPLE_TIMES; i++) {
    rs += MQResistanceCalculation(analogRead(mq_pin));
    delay(READ_SAMPLE_INTERVAL);
  }
 
  rs = rs/READ_SAMPLE_TIMES;
  return rs;  
}
 
int MQGetGasPercentage(float rs_ro_ratio, int gas_id) {
  if (gas_id == GAS_SMOKE) {
    return MQGetPercentage(rs_ro_ratio, SmokeCurve);
  }
  return 0;
}
 
int MQGetPercentage(float rs_ro_ratio, float *pcurve) {
  return (pow(10, (((log10(rs_ro_ratio)-pcurve[1])/pcurve[2]) + pcurve[0])));
}