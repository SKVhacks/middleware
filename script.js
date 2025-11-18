const express = require("express");
const cors = require("cors");
const expressWs = require("express-ws");

const app = express();
expressWs(app);
app.use(cors());
app.use(express.json());

// ---- Global Sockets ----
let esp32 = null;            // only 1 device
let dashboards = [];         // multiple dashboards

// -------------------------
// ESP32 WebSocket endpoint
// -------------------------
app.ws("/device", (ws) => {
  esp32 = ws;
  console.log("ESP32 Connected");

  ws.on("message", (msg) => {
    console.log("ESP32 → Server:", msg);

    // forward data to dashboards
    dashboards.forEach(client => client.send(msg));
  });

  ws.on("close", () => {
    console.log("ESP32 Disconnected");
    esp32 = null;
  });
});

// -------------------------
// Dashboard WebSocket
// -------------------------
app.ws("/dashboard", (ws) => {
  dashboards.push(ws);
  console.log("Dashboard Connected");

  ws.on("close", () => {
    dashboards = dashboards.filter(c => c !== ws);
    console.log("Dashboard Disconnected");
  });
});

// -------------------------
// API → Control ESP32
// -------------------------
function sendToESP(json) {
  if (!esp32) return false;
  esp32.send(JSON.stringify(json));
  return true;
}

// FAN control
app.post("/fan/:state", (req, res) => {
  const on = req.params.state === "on";
  if (!sendToESP({ fan: on }))
    return res.status(500).send("ESP32 not connected");
  res.send(`Fan turned ${on ? "ON" : "OFF"}`);
});

// BUZZER control
app.post("/buzzer/:state", (req, res) => {
  const on = req.params.state === "on";
  if (!sendToESP({ buzzer: on }))
    return res.status(500).send("ESP32 not connected");
  res.send(`Buzzer turned ${on ? "ON" : "OFF"}`);
});

// RESET logic
app.post("/reset", (req, res) => {
  if (!sendToESP({ reset: true }))
    return res.status(500).send("ESP32 not connected");
  res.send("Reset sent");
});

// -------------------------
app.get("/", (req, res) => {
  res.send("Middleware is running 😎");
});

// -------------------------
app.listen(3000, () => {
  console.log("Server running on PORT 3000");
});
