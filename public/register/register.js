document.getElementById('registerForm').addEventListener('submit', async function(event) {
  event.preventDefault();

  const email = document.getElementById('email').value.trim();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value;
  const confirmPassword = document.getElementById('confirmPassword').value;
  const popup = document.getElementById('register-popup');

  popup.innerText = "";

  if (!email || !username || !password || !confirmPassword) {
    popup.innerText = "⚠️ Please fill in all fields.";
    return;
  }

  if (password !== confirmPassword) {
    popup.innerText = "⚠️ Passwords do not match.";
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, username, password })
    });

    const data = await response.json();

    if (response.ok) {
      alert("✅ Registration successful! You can now log in.");
      window.location.href = "../login/login.html";
    } else {
      popup.innerText = `❌ ${data.error}`;
    }
  } catch (err) {
    console.error("Registration failed", err);
    popup.innerText = "❌ Server error. Try again later.";
  }
});
