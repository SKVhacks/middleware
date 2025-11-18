const express = require("express");
const cors = require("cors");
const expressWs = require("express-ws");

const app = express();
expressWs(app);
app.use(cors());
app.use(express.json());

let esp32 = null;
let dashboards = [];

// ESP32 WebSocket
app.ws("/device", (ws) => {
  esp32 = ws;
  console.log("ESP32 Connected");

  ws.on("message", (msg) => {
    dashboards.forEach(c => c.send(msg));
  });

  ws.on("close", () => {
    console.log("ESP32 Disconnected");
    esp32 = null;
  });
});

// Dashboard WebSocket
app.ws("/dashboard", (ws) => {
  dashboards.push(ws);
  console.log("Dashboard Connected");

  ws.on("close", () => {
    dashboards = dashboards.filter(c => c !== ws);
  });
});

// APIs
app.post("/fan/:state", (req, res) => {
  if (!esp32) return res.status(500).send("ESP32 not connected");
  esp32.send(JSON.stringify({ fan: req.params.state === "on" }));
  res.send("OK");
});

app.post("/buzzer/:state", (req, res) => {
  if (!esp32) return res.status(500).send("ESP32 not connected");
  esp32.send(JSON.stringify({ buzzer: req.params.state === "on" }));
  res.send("OK");
});

app.post("/reset", (req, res) => {
  if (!esp32) return res.status(500).send("ESP32 not connected");
  esp32.send(JSON.stringify({ reset: true }));
  res.send("OK");
});

// Railway port
const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Server running on PORT " + port));
