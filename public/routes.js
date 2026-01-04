const express = require("express");
const router = express.Router();
const User = require("../models/User");

router.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password)
    return res.status(400).json({ error: "All fields are required." });

  try {
    const user = await User.findOne({ username });

    if (!user) return res.status(401).json({ error: "User not found." });

    if (user.password !== password)
      return res.status(401).json({ error: "Incorrect password." });

    res.json({ username: user.username });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

router.post("/api/register", async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password)
    return res.status(400).json({ error: "All fields are required." });

  try {
    const existingEmail = await User.findOne({ email });
    if (existingEmail)
      return res.status(400).json({ error: "Email already in use." });

    const existingUsername = await User.findOne({ username });
    if (existingUsername)
      return res.status(400).json({ error: "Username already taken." });

    const newUser = new User({ email, username, password }); 
    await newUser.save();

    res.status(201).json({ message: "User registered successfully!" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

router.get("/api/user/:username", async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });

    if (!user) return res.status(404).json({ error: "User not found." });

    res.json({ username: user.username, email: user.email });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error." });
  }
});

module.exports = router;
