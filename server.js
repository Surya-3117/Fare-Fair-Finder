require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const path = require("path");
const connectDB = require("./db");
const Fare = require("./models/Fare");
const authRoutes = require("./public/routes");

connectDB();

const app = express();
const PORT = process.env.PORT || 5000;
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, "public")));
app.use(authRoutes);

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login", "login.html"));
});

app.get("/login", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login", "login.html"));
});

app.get("/register", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "register", "register.html"));
});

async function getCoordinates(address) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${API_KEY}`;
  const response = await axios.get(url);
  if (response.data.status === "OK") {
    return response.data.results[0].geometry.location;
  } else {
    throw new Error("Location not found");
  }
}

async function getDistance(startLocation, endLocation) {
  const url = `https://routes.googleapis.com/directions/v2:computeRoutes?key=${API_KEY}`;
  const requestData = {
    origin: { location: { latLng: { latitude: startLocation.lat, longitude: startLocation.lng } } },
    destination: { location: { latLng: { latitude: endLocation.lat, longitude: endLocation.lng } } },
    travelMode: "DRIVE",
    routingPreference: "TRAFFIC_AWARE",
    computeAlternativeRoutes: false,
    routeModifiers: { avoidTolls: false },
    languageCode: "en-US",
    units: "METRIC"
  };
  const response = await axios.post(url, requestData, {
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": API_KEY,
      "X-Goog-FieldMask": "routes.distanceMeters"
    }
  });
  if (response.data.routes && response.data.routes.length > 0) {
    return response.data.routes[0].distanceMeters / 1000;
  } else {
    throw new Error("No route found");
  }
}

function calculateFare(distance, waitingTime = 0, nightTime = false) {
  const baseFare = 50;
  const perKmRate = 18;
  const baseDistance = 1.8;
  const waitingChargePerMinute = 1;
  const nightTimeSurchargeRate = 0.25;

  let fare = distance <= baseDistance ? baseFare : baseFare + (distance - baseDistance) * perKmRate;
  fare += waitingTime * waitingChargePerMinute;

  if (nightTime) {
    fare += fare * nightTimeSurchargeRate;
  }

  return fare;
}

app.post("/calculate-fare", async (req, res) => {
  try {
    const { start, end, username, email, waitingTime = 0, nightTime = false } = req.body;

    const startCoords = await getCoordinates(start);
    const endCoords = await getCoordinates(end);
    const distance = await getDistance(startCoords, endCoords);
    const fare = calculateFare(distance, waitingTime, nightTime);

    const fareEntry = new Fare({ start, end, distance, fare, username, email });
    await fareEntry.save();

    res.json({ distance: distance.toFixed(2), fare });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get("/get-api-key", (req, res) => {
  res.json({ apiKey: API_KEY });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
