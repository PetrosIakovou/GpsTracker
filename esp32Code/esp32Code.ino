#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <TinyGPSPlus.h>
#include <WebSocketsServer.h>

#define LED_BUILTIN 2
// Define the RX and TX pins for Serial 2
#define RXD2 16
#define TXD2 17

#define GPS_BAUD 9600

const char* ssid = "WiFi name";
const char* password = "Password";

String serverEndpoint = "http://<Server's ip>:4000/data"; 


// WebSocket server on port 81
WebSocketsServer webSocket = WebSocketsServer(81);


// Handle WebSocket events
void onWebSocketEvent(uint8_t num, WStype_t type, uint8_t *payload, size_t length) {
    if (type == WStype_TEXT) {
        String message = String((char*)payload);
        String response = "";
        Serial.println("Message from client: " + message);

        if (message == "On"){
            digitalWrite(LED_BUILTIN, HIGH);	// turn on the LED
            delay(2000);
            response = "turn on the LED";
          }
        if (message == "Off"){
          digitalWrite (LED_BUILTIN, LOW);	// turn off the LED
          delay(2000);
          response = "turn off the LED";
        } 
        // Send a response back to the client  
        webSocket.sendTXT(num, response);
    }
}

// The TinyGPSPlus object
TinyGPSPlus gps;
// Create an instance of the HardwareSerial class for Serial 2
HardwareSerial gpsSerial(2);

// Variables to store parsed GPS data
float latitude = 0.0, longitude = 0.0, velocity = 0.0, course = 0.0, altitude = 0.0;
int satellites = 0;
String timestamp, date;

String  dataJSON;

void setup() {
    Serial.begin(115200);

    // setup pin 5 as a digital output pin
    pinMode (LED_BUILTIN, OUTPUT);
    digitalWrite(LED_BUILTIN, HIGH);

    // Connect to Wi-Fi
    WiFi.begin(ssid, password);
    Serial.print("Connecting to Wi-Fi");
    while (WiFi.status() != WL_CONNECTED) {
        delay(500);
        Serial.print(".");
    }
    Serial.println("\nConnected to Wi-Fi. IP address: " + WiFi.localIP().toString());
    
    // Start Serial 2 with the defined RX and TX pins and a baud rate of 9600
    gpsSerial.begin(GPS_BAUD, SERIAL_8N1, RXD2, TXD2);
    Serial.println("Serial 2 started at 9600 baud rate");

    // Start WebSocket server
    webSocket.begin();
    webSocket.onEvent(onWebSocketEvent);
    Serial.println("WebSocket server started");
}

void loop() {
        Serial.println("\nConnected to Wi-Fi. IP address: " + WiFi.localIP().toString());

    // Handle other tasks here, for example:
    sentToServer();
    // Handle WebSocket communication
    webSocket.loop();    
}

void sentToServer() {

    static unsigned long lastTime = 0;
    if (millis() - lastTime >= 1000) {

        getData();
        dataJSON =convertToJson();
        Serial.println(dataJSON);

        // Send data  after generating JSON
        if (WiFi.status() == WL_CONNECTED) {
          HTTPClient http;

          // Start a POST request
          http.begin(serverEndpoint);
          http.addHeader("Content-Type", "application/json"); 

          int httpResponseCode = http.POST(dataJSON);

          // Handle server response
          if (httpResponseCode > 0) {
            Serial.print("Server response: ");
            Serial.println(httpResponseCode);
            String response = http.getString();
            Serial.println("Response payload: ");
            Serial.println(response);
          } else {
            Serial.print("Error sending POST request: ");
            Serial.println(httpResponseCode);
          }

          http.end(); // Close connection
        } else {
          Serial.println("WiFi not connected. Unable to send data.");
        }
      
        lastTime = millis();
    }
    Serial.println();
    Serial.println(F("Done."));
    delay(500);
}

void getData(){

  while (gpsSerial.available() > 0){
    gps.encode(gpsSerial.read());
  }
  //Get latitude & longitude 
  if (gps.location.isUpdated())
  {
    latitude = gps.location.lat();
    longitude = gps.location.lng();
  }
  //Get date
  if (gps.date.isUpdated())
  {
    date = String(String(gps.date.year()) + "-" + String(gps.date.month()) + "-" + String(gps.date.day()));
  }
  //Get timestamp
  if (gps.time.isUpdated())
  {
    timestamp = String(date + " " + gps.time.hour() + ":" + gps.time.minute() + ":" + gps.time.second());
  }
  //Get speed
  if (gps.speed.isUpdated()){
    velocity = gps.speed.kmph(); // Speed in km/h 
  }
  //Get course
  if (gps.course.isUpdated()){
    course = gps.course.deg(); 
  }
  //Get altitude
  if (gps.altitude.isUpdated()){
    altitude = gps.altitude.meters(); 
  }
  //Get satellites
  if (gps.satellites.isUpdated()){
    satellites = gps.satellites.value();
  }
}

String convertToJson(){

  StaticJsonDocument<512> doc;

  // Add the GPRMC data
  doc["timestamp"] = timestamp;
  doc["date"] = date;
  doc["latitude"] = latitude;
  doc["longitude"] = longitude;
  doc["velocity"] = velocity;
  doc["course"] = course;

  // Add the GPGGA data
  doc["altitude"] = altitude;
  doc["satellites"] = satellites;

  // Serialize the JSON object to the Serial Monitor
  String output;
  serializeJson(doc, output);
  return output;
}
