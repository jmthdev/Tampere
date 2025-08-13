const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
app.use(cors());

// 🔹 MongoDB yhteys
const username = "jiihoo86";
const password = "nEftGs4HGl5HUbvh";
const cluster = "cluster0.mongodb.net";
const dbname = "visitorDB";

const uri = `mongodb+srv://${username}:${password}@${cluster}/${dbname}?retryWrites=true&w=majority`;

mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("✅ Yhdistetty MongoDB:hen"))
  .catch(err => console.error("❌ MongoDB-yhteysvirhe:", err));

// 🔹 Mongoose-malli
const VisitorSchema = new mongoose.Schema({
  count: { type: Number, default: 0 }
});
const Visitor = mongoose.model("Visitor", VisitorSchema);

// 🔹 API-reitti vierailijoiden hakemiseen ja kasvattamiseen
app.get("/api/visitors", async (req, res) => {
  try {
    let visitors = await Visitor.findOne();
    if (!visitors) {
      visitors = new Visitor({ count: 1 });
      await visitors.save();
    } else {
      visitors.count += 1;
      await visitors.save();
    }
    res.json({ count: visitors.count });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 Portti (Vercel käyttää automaattisesti)
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`🚀 Serveri käynnissä portissa ${PORT}`));
