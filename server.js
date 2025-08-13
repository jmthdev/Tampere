const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Yhdistä MongoDB:hen
mongoose
  .connect(process.env.MONGODB_URI || "mongodb://localhost:27017/visitorDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Yhdistetty MongoDB:hen"))
  .catch((err) => console.error("❌ MongoDB virhe:", err));

// Luodaan schema ja malli
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

// Käynnistä serveri lokaalisti
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveri käynnissä portissa ${PORT}`));
