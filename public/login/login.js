document.getElementById("loginForm").addEventListener("submit", login);

async function login(event) {
  event.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const popup = document.getElementById("login-popup");

  function showPopup(message, isError = true) {
    popup.textContent = message;
    popup.style.background = isError ? "rgba(255, 69, 0, 0.9)" : "rgba(0, 128, 0, 0.85)";
    popup.style.display = "block"; // Ensure it's visible

    // Restart animation
    popup.classList.remove("show");
    void popup.offsetWidth; // Trigger reflow
    popup.classList.add("show");

    setTimeout(() => {
      popup.style.display = "none";
    }, 3000);
  }

  if (!username || !password) {
    showPopup("⚠️ Please enter both fields.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    const data = await response.json();

    if (response.ok) {
      localStorage.setItem("isLoggedIn", "true");
      localStorage.setItem("username", data.username);
      showPopup("✅ Login successful!", false);

      setTimeout(() => {
        window.location.href = "../index/index.html";
      }, 1000);
    } else {
      showPopup(`❌ ${data.error}`);
    }
  } catch (error) {
    console.error("Login failed", error);
    showPopup("❌ Server error. Try again later.");
  }
}
