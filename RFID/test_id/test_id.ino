#include <SPI.h>
#include <MFRC522.h>

#define SS_PIN 10  
#define RST_PIN 9 

MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(9600);
  while (!Serial);
  SPI.begin();
  mfrc522.PCD_Init();
  Serial.println("Quet the RFID de lay ID...");
  Serial.print("Kiem tra module RFID: ");
  if (mfrc522.PCD_PerformSelfTest()) {
    Serial.println("Module OK");
  } else {
    Serial.println("Module loi, kiem tra ket noi!");
  }
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent()) {
    Serial.println("Khong phat hien the RFID...");
    delay(5000);
    return;
  }
  if (!mfrc522.PICC_ReadCardSerial()) {
    Serial.println("Khong the doc du lieu the...");
    delay(500);
    return;
  }
  String cardID = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    cardID += String(mfrc522.uid.uidByte[i] < 0x10 ? "0" : "");
    cardID += String(mfrc522.uid.uidByte[i], HEX);
  }
  cardID.toLowerCase();
  Serial.print("Card ID: ");
  Serial.println(cardID);
  mfrc522.PICC_HaltA();
  delay(500);
}