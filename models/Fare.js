const mongoose = require("mongoose");

const FareSchema = new mongoose.Schema({
    username: String,
    email: String,
    start: String,
    end: String,
    distance: Number,
    fare: Number,
    timestamp: { type: Date, default: () => new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })) 
}
});

module.exports = mongoose.model("Fare", FareSchema);    