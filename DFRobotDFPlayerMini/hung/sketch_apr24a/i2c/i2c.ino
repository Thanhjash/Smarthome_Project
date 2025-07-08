#include <Wire.h>

void setup() {
  Serial.begin(115200);
  Wire.begin(/* SDA= */ GPIO_NUM_8, /* SCL= */ GPIO_NUM_9);  // Replace X & Y with your ESP32-S3 pins
  Serial.println("\nI2C Scanner");
}

void loop() {
  byte error, address;
  int foundDevices = 0;

  Serial.println("Scanning...");
  for (address = 1; address < 127; address++) {
    Wire.beginTransmission(address);
    error = Wire.endTransmission();

    if (error == 0) {
      Serial.print("Found device at 0x");
      if (address < 16) Serial.print("0");
      Serial.println(address, HEX);
      foundDevices++;
    }
  }

  if (foundDevices == 0) {
    Serial.println("No I2C devices found. Check wiring!");
  }

  delay(5000);  // Scan every 5 seconds
}
