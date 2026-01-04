async function fetchFare() {
  const startInput = document.getElementById("start");
  const endInput = document.getElementById("end");
  const waitingInput = document.getElementById("waitingTime");
  const nightInput = document.getElementById("nightTime");

  const start = startInput.value.trim();
  const end = endInput.value.trim();
  const waitingTime = parseInt(waitingInput.value.trim()) || 0;
  const isNightTime = nightInput.value === "Yes";

  const resultDiv = document.getElementById("result");
  const loader = document.getElementById("loader");
  const button = document.querySelector(".container button");
  const popup = document.getElementById("popup");

  resultDiv.innerHTML = "";
  resultDiv.classList.remove("show");
  popup.style.display = "none";

  if (localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login/login.html";
    return;
  }

  if (!start || !end) {
    showPopup("⚠️ Please enter both start and end locations.");
    return;
  }

  if (start.toLowerCase() === end.toLowerCase()) {
    showPopup("⚠️ Start and Destination locations should not be the same.");
    return;
  }

  loader.style.display = "block";
  button.disabled = true;
  button.style.background = "#b5b5b5";

  try {
    const username = localStorage.getItem("username");

    const response = await fetch("http://localhost:5000/calculate-fare", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ start, end, username, waitingTime, isNightTime })
    });

    const data = await response.json();

    loader.style.display = "none";
    button.disabled = false;
    button.style.background = "#ff9800";

    if (response.ok) {
      const baseFare = 50;
      const baseDistance = 1.8;
      const perKmRate = 18;
      const waitingChargePerMinute = 1.5;
      const nightTimeSurcharge = isNightTime ? 0.5 : 0;

      const travelFare = data.distance <= baseDistance
        ? baseFare
        : baseFare + (data.distance - baseDistance) * perKmRate;

      const waitingCharge = waitingTime * waitingChargePerMinute;
      const nightCharge = (travelFare + waitingCharge) * nightTimeSurcharge;
      const totalFare = travelFare + waitingCharge + nightCharge;

      let fareBreakdown = `🛺 Distance: ${data.distance} km<br>`;
      fareBreakdown += `🚖 Fare Rate: ₹${travelFare.toFixed(2)}<br>`;
      if (waitingTime > 0) {
        fareBreakdown += `⏳ Waiting Charges: ₹${waitingCharge.toFixed(2)}<br>`;
      }
      if (isNightTime) {
        fareBreakdown += `🌙 Night Ride Surcharge (50%): ₹${nightCharge.toFixed(2)}<br>`;
      }
      fareBreakdown += `💸 Total Estimated Fare: ₹${totalFare.toFixed(2)}`;

      resultDiv.innerHTML = fareBreakdown;
      resultDiv.classList.add("show");
      addToHistory(start, end, data.distance, totalFare);
      showRouteOnMap(start, end);
      startInput.value = "";
      endInput.value = "";
      waitingInput.value = "";
      nightInput.value = "No";
    } else {
      showPopup(`⚠️ Error: ${data.error}`);
    }
  } catch (error) {
    loader.style.display = "none";
    button.disabled = false;
    button.style.background = "#ff9800";
    showPopup("❌ Failed to fetch data. Check server connection.");
  }
}

function showPopup(message) {
  const popup = document.getElementById("popup");
  popup.innerText = message;
  popup.style.display = "block";
  setTimeout(() => {
    popup.style.display = "none";
  }, 3000);
}

function addTooltip(element, message) {
  element.setAttribute("title", message);
}

function addToHistory(start, end, distance, fare) {
  const history = JSON.parse(localStorage.getItem("fareHistory")) || [];
  history.push({ start, end, distance, fare, timestamp: new Date().toLocaleString() });
  localStorage.setItem("fareHistory", JSON.stringify(history));
}

function showRouteOnMap(start, end) {
  const directionsService = new google.maps.DirectionsService();
  const directionsRenderer = new google.maps.DirectionsRenderer();
  const map = new google.maps.Map(document.getElementById("map"), {
    zoom: 7,
    center: { lat: 20.5937, lng: 78.9629 }
  });
  directionsRenderer.setMap(map);

  directionsService.route(
    {
      origin: start,
      destination: end,
      travelMode: google.maps.TravelMode.DRIVING
    },
    (response, status) => {
      if (status === google.maps.DirectionsStatus.OK) {
        directionsRenderer.setDirections(response);
      } else {
        showPopup("⚠️ Failed to load map preview.");
      }
    }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  addTooltip(document.getElementById("start"), "Enter your starting location.");
  addTooltip(document.getElementById("end"), "Enter your destination.");
  addTooltip(document.getElementById("waitingTime"), "Enter total waiting time in minutes.");
  addTooltip(document.getElementById("nightTime"), "Choose if ride is during night time.");

  const username = localStorage.getItem("username");
  if (!username || localStorage.getItem("isLoggedIn") !== "true") {
    window.location.href = "login/login.html";
    return;
  }

  const usernameDisplay = document.getElementById("username");
  if (usernameDisplay) {
    usernameDisplay.innerText = `Welcome, ${username}`;
  }

  document.getElementById("logoutBtn")?.addEventListener("click", logout);

  if (!window.google || !window.google.maps) {
    fetch("/get-api-key")
      .then(res => res.json())
      .then(data => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${data.apiKey}&callback=initMap`;
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      })
      .catch(err => {
        console.error("Failed to load Google Maps script", err);
        showPopup("❌ Could not load map. Check API Key.");
      });
  } else {
    initMap();
  }
});

function initMap() {
  new google.maps.Map(document.getElementById("map"), {
    center: { lat: 20.5937, lng: 78.9629 },
    zoom: 5
  });
}

function logout() {
  localStorage.removeItem("isLoggedIn");
  localStorage.removeItem("username");
  window.location.href = "../login/login.html";
}
