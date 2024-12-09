// Connect to the WebSocket server
//var socket = io.connect('http://' + document.domain + ':' + location.port);
//var socket = io.connect("http://192.168.1.100:4000"); //spiti
var socket = io.connect("http://160.40.48.227:4000"); // hotspot

// Initial placeholder coordinates
var map = L.map("map");
// Add OpenStreetMap tile layer
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution:
    '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);

// Establish a WebSocket connection to the ESP32
//const esp32Socket = new WebSocket("ws://192.168.1.2:81"); // Replace with your ESP32's IP and port. this ip in my home
const esp32Socket = new WebSocket("ws://192.168.24.113:81"); // Replace with your ESP32's IP and port. this ip in HOTSPOT

const toggleButton = document.getElementById("toggleButton");

document.addEventListener("DOMContentLoaded", function () {
  // Check login status
  const isLoggedIn = localStorage.getItem("isLoggedIn");

  if (isLoggedIn === "true") {
    // Show the page content if logged in
    document.body.style.visibility = "visible";
    console.log("User is logged in. Content is visible.");
  }
  // Attach logout functionality
  const logoutButton = document.getElementById("logoutButton");
  logoutButton.addEventListener("click", function () {
    // Clear login status from localStorage
    localStorage.removeItem("isLoggedIn");

    // Hide the content
    document.body.style.visibility = "hidden";

    // Redirect to login.html
    window.location.assign("login.html");
  });
});

// Request data from the server periodically (every 5 seconds)
setInterval(function () {
  socket.emit("request_data");
}, 20000); // Request new data every 20 seconds

// Listen for the 'update_data' event from the server
socket.on("update_data", function (data) {
  // Create a new row for each new data set
  var newRow = document.createElement("tr");

  // Create and append cells to the row for each data field
  var timestampCell = document.createElement("td");
  timestampCell.innerText = data.timestamp || "No data";
  newRow.appendChild(timestampCell);

  var latitudeCell = document.createElement("td");
  latitudeCell.innerText = data.latitude || "No data";
  newRow.appendChild(latitudeCell);

  var longitudeCell = document.createElement("td");
  longitudeCell.innerText = data.longitude || "No data";
  newRow.appendChild(longitudeCell);

  var altitudeCell = document.createElement("td");
  altitudeCell.innerText = data.altitude || "No data";
  newRow.appendChild(altitudeCell);

  var velocityCell = document.createElement("td");
  velocityCell.innerText = data.velocity || "No data";
  newRow.appendChild(velocityCell);

  var courseCell = document.createElement("td");
  courseCell.innerText = data.course || "No data";
  newRow.appendChild(courseCell);

  var satellitesCell = document.createElement("td");
  satellitesCell.innerText = data.satellites || "No data";
  newRow.appendChild(satellitesCell);

  // Append the new row to the table body
  document.querySelector("tbody").appendChild(newRow);

  var latitude = data.latitude;
  var longitude = data.longitude;

  // Check if the latitude and longitude are valid
  if (latitude && longitude) {
    // Update the map's center
    map.setView([latitude, longitude], 13); // 13 is the zoom level

    // Optionally, add a marker
    L.marker([latitude, longitude])
      .addTo(map)
      .bindPopup("Current Location")
      .openPopup();
  } else {
    console.error("Latitude and longitude not available.");
  }
});

document.addEventListener("DOMContentLoaded", function () {
  // Connect to the WebSocket server
  var socket = io.connect("http://160.40.48.227:4000");

  // Request data from the server periodically (every 5 seconds)
  setInterval(function () {
    socket.emit("request_data");
  }, 5000); // Request new data every 5 seconds

  // Listen for the 'update_data' event from the server
  socket.on("update_data", function (data) {
    // Get the <tbody> element
    const tbody = document.querySelector("tbody");

    // Check if tbody is found
    if (!tbody) {
      console.error("Error: <tbody> element not found.");
      return;
    }

    // Create a new row for each new data set
    var newRow = document.createElement("tr");

    // Create and append cells to the row for each data field
    var timestampCell = document.createElement("td");
    timestampCell.innerText = data.timestamp || "No data";
    newRow.appendChild(timestampCell);

    var latitudeCell = document.createElement("td");
    latitudeCell.innerText = data.latitude || "No data";
    newRow.appendChild(latitudeCell);

    var longitudeCell = document.createElement("td");
    longitudeCell.innerText = data.longitude || "No data";
    newRow.appendChild(longitudeCell);

    var altitudeCell = document.createElement("td");
    altitudeCell.innerText = data.altitude || "No data";
    newRow.appendChild(altitudeCell);

    var velocityCell = document.createElement("td");
    velocityCell.innerText = data.velocity || "No data";
    newRow.appendChild(velocityCell);

    var courseCell = document.createElement("td");
    courseCell.innerText = data.course || "No data";
    newRow.appendChild(courseCell);

    var satellitesCell = document.createElement("td");
    satellitesCell.innerText = data.satellites || "No data";
    newRow.appendChild(satellitesCell);

    // Check if there are already 5 rows in the table
    if (tbody.rows.length >= 3) {
      console.log("More than 5 rows, removing the oldest row...");

      // Set the number of rows to delete
      const rowsToDelete = tbody.rows.length - 2;

      // Loop to delete the oldest rows
      for (let i = 0; i < rowsToDelete; i++) {
        tbody.deleteRow(0); // Always remove the first row (oldest)
      }
    }

    // Append the new row to the table body
    tbody.appendChild(newRow);
    console.log("Row added successfully. Total rows:", tbody.rows.length);

    // For debugging: print all current rows
    console.log("Current rows in tbody:", tbody.rows.length);
  });
});

// Handle the WebSocket connection opening
esp32Socket.onopen = () => {
  console.log("WebSocket connection to ESP32 opened successfully.");
  // Optionally, send an initial message to the ESP32
  esp32Socket.send("Hello from the browser");
};

// Handle incoming messages from the ESP32
esp32Socket.onmessage = (event) => {
  console.log("Message from ESP32:", event.data);
};

// Handle WebSocket errors
esp32Socket.onerror = (error) => {
  console.error("WebSocket error:", error);
};

// Handle WebSocket connection closure
esp32Socket.onclose = (event) => {
  console.log("WebSocket connection closed.");
  console.log("Close status code:", event.code);
  console.log("Close reason:", event.reason);
};

toggleButton.addEventListener("click", () => {
  // Check if WebSocket is open
  if (esp32Socket.readyState === WebSocket.OPEN) {
    // If the button currently says "Turn On", send "turn on" message
    if (toggleButton.textContent === "On") {
      esp32Socket.send("On");
      console.log("Turning on the LED");

      // Update button text to "Turn Off"
      toggleButton.textContent = "Off";
      toggleButton.style.backgroundColor = "#a4a6a8";
    }
    // If the button currently says "Turn Off", send "turn off" message
    else {
      esp32Socket.send("Off");
      console.log("Turning off the LED");

      // Update button text to "Turn On"
      toggleButton.textContent = "On";
      toggleButton.style.backgroundColor = "#007bff";
    }
  } else {
    console.error("WebSocket is not open. Unable to send message.");
  }
});
