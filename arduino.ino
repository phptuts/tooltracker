/*
Many thanks to nikxha from the ESP8266 forum
*/

#include <ESP8266HTTPClient.h>
#include <ESP8266WiFi.h>
#include <SPI.h>
#include "MFRC522.h"

/* wiring the MFRC522 to ESP8266 (ESP-12)
RST     = GPIO5
SDA(SS) = GPIO4
MOSI    = GPIO13
MISO    = GPIO12
SCK     = GPIO14
GND     = GND
3.3V    = 3.3V
*/

#define RST_PIN  5  // RST-PIN für RC522 - RFID - SPI - Modul GPIO5
#define SS_PIN  4  // SDA-PIN für RC522 - RFID - SPI - Modul GPIO4

const char *ssid =  "ATXHackerspace";     // change according to your Network - cannot be longer than 32 characters!
const char *pass =  "hackon!!"; // change according to your Network

MFRC522 mfrc522(SS_PIN, RST_PIN); // Create MFRC522 instance

void setup() {
  Serial.begin(9600);    // Initialize serial communications
  delay(250);
  Serial.println(F("Booting...."));
  // The begin call takes the width and height. This
  // Should match the number provided to the constructor.
  SPI.begin();           // Init SPI bus
  mfrc522.PCD_Init();    // Init MFRC522

  WiFi.begin(ssid, pass);
  while (WiFi.status() != WL_CONNECTED) {  //Wait for the WiFI connection completion

    delay(500);
    Serial.println("Waiting for connection");

  }

  int retries = 0;
  while ((WiFi.status() != WL_CONNECTED) && (retries < 10)) {
    retries++;
    delay(500);
    Serial.print(".");
  }
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println(F("WiFi connected"));
  }

  Serial.println(F("Ready!"));


}

void loop() {
  // Look for new cards
  if ( ! mfrc522.PICC_IsNewCardPresent()) {
    delay(50);
    return;
  }
  // Select one of the cards
  if ( ! mfrc522.PICC_ReadCardSerial()) {
    delay(50);
    return;
  }

  // This is to prevent partial reads
  if (mfrc522.uid.size != 4) {
      delay(50);
      return;
  }

   String rfidUID = readRFIDString(mfrc522.uid.uidByte, mfrc522.uid.size);
   String json = "{\"rfid\":\"" + rfidUID + "\"}";
   Serial.println(json);
   HTTPClient http;    //Declare object of class HTTPClient

   http.begin("http://192.168.1.104:3000/rfid-scan");      //Specify request destination
   http.addHeader("Content-Type", "application/json");  //Specify content-type header

   int httpCode = http.POST(json);   //Send the request
   String payload = http.getString();                  //Get the response payload

   Serial.println(httpCode);   //Print HTTP return code
   Serial.println(payload);    //Print request response payload

   http.end();  //Close connection
}

// Helper routine to dump a byte array as hex values to Serial
String readRFIDString(byte *buffer, byte bufferSize) {
  String rfid = "";
  for (byte i = 0; i < bufferSize; i++) {

      rfid += buffer[i];
      if (i + 1 < bufferSize) {
          rfid += "-";
      }
  }

  return rfid;
}