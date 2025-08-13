// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// MongoDB Atlas -yhteys
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Yhteys Atlas MongoDB:hen ok"))
  .catch((err) => console.error("❌ MongoDB-virhe:", err));

// Schema ja malli
const visitorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 },
});

const Visitor = mongoose.model("Visitor", visitorSchema);

// API: hae kävijämäärä
app.get("/api/visitors", async (req, res) => {
  try {
    let visitor = await Visitor.findOne();
    if (!visitor) {
      visitor = new Visitor({ count: 0 });
      await visitor.save();
    }
    res.json({ count: visitor.count });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// API: lisää kävijä
app.post("/api/visitors", async (req, res) => {
  try {
    let visitor = await Visitor.findOne();
    if (!visitor) {
      visitor = new Visitor({ count: 1 });
    } else {
      visitor.count += 1;
    }
    await visitor.save();
    res.json({ count: visitor.count });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Perusreitti pääsivulle
app.get("/", (req, res) => res.send("Server running 🚀"));

// Export Vercelille
module.exports = app;
