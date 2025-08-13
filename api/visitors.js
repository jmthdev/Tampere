const { MongoClient } = require('mongodb');

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db('kotimme-tampere');
  cachedDb = db;
  return db;
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const db = await connectToDatabase();
    const sessions = db.collection('sessions');
    const stats = db.collection('stats');
    
    if (req.method === 'POST') {
      const { sessionId } = req.body || {};
      const now = new Date();
      
      // Päivitä sessio
      if (sessionId) {
        await sessions.updateOne(
          { sessionId },
          { 
            $set: { 
              sessionId,
              lastActivity: now
            }
          },
          { upsert: true }
        );
      }
      
      // Päivitä tilastot
      const today = now.toISOString().split('T')[0];
      await stats.updateOne(
        { date: today },
        { 
          $inc: { totalVisitors: 1 },
          $setOnInsert: { date: today }
        },
        { upsert: true }
      );
      
      // Poista vanhat sessiot
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      await sessions.deleteMany({ 
        lastActivity: { $lt: fiveMinutesAgo } 
      });
    }
    
    // Hae tilastot
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineCount = await sessions.countDocuments({
      lastActivity: { $gte: fiveMinutesAgo }
    });
    
    const totalStats = await stats.aggregate([
      { $group: { _id: null, total: { $sum: '$totalVisitors' } } }
    ]).toArray();
    
    const totalVisitors = totalStats[0]?.total || 0;
    
    return res.status(200).json({
      online: onlineCount,
      total: totalVisitors,
      timestamp: new Date()
    });
    
  } catch (error) {
    console.error('Database error:', error);
    
    // Palauta demo-data jos tietokanta ei toimi
    return res.status(200).json({
      online: Math.floor(Math.random() * 20) + 5,
      total: 45678,
      timestamp: new Date(),
      demo: true
    });
  }
};