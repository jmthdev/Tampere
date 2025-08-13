const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

const app = express();

// Middleware
app.use(express.json());
app.use(express.static('public'));

// MongoDB yhteys
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/kotimme-tampere', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    isConnected = true;
    console.log('MongoDB yhdistetty');
  } catch (error) {
    console.error('MongoDB yhteysvirhe:', error);
  }
};

// Visitor Schema
const visitorSchema = new mongoose.Schema({
  sessionId: String,
  lastActivity: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now }
});

const statsSchema = new mongoose.Schema({
  date: String,
  totalVisitors: { type: Number, default: 0 },
  dailyVisitors: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

const Visitor = mongoose.models.Visitor || mongoose.model('Visitor', visitorSchema);
const Stats = mongoose.models.Stats || mongoose.model('Stats', statsSchema);

// API endpoint kävijälaskurille
app.post('/api/visitors', async (req, res) => {
  try {
    await connectDB();
    
    const { sessionId } = req.body;
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    
    // Päivitä tai luo sessio
    await Visitor.findOneAndUpdate(
      { sessionId },
      { lastActivity: now },
      { upsert: true, new: true }
    );
    
    // Päivitä päivätilastot
    await Stats.findOneAndUpdate(
      { date: today },
      { 
        $inc: { totalVisitors: 1, dailyVisitors: 1 },
        $setOnInsert: { createdAt: now }
      },
      { upsert: true }
    );
    
    // Poista vanhat sessiot (yli 5 min)
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    await Visitor.deleteMany({ lastActivity: { $lt: fiveMinutesAgo } });
    
    // Hae tilastot
    const onlineCount = await Visitor.countDocuments({
      lastActivity: { $gte: fiveMinutesAgo }
    });
    
    const totalStats = await Stats.aggregate([
      { $group: { _id: null, total: { $sum: '$totalVisitors' } } }
    ]);
    
    res.json({
      online: onlineCount,
      total: totalStats[0]?.total || 0,
      today: (await Stats.findOne({ date: today }))?.dailyVisitors || 0
    });
    
  } catch (error) {
    console.error('API virhe:', error);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// Etusivu
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Käynnistä palvelin (Vercel hoitaa tämän)
if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Palvelin käynnissä portissa ${PORT}`);
  });
}

// Export Vercelille
module.exports = app;