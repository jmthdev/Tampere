const { MongoClient } = require('mongodb');

// MongoDB connection
let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) {
    return cachedDb;
  }

  const client = await MongoClient.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const db = client.db('kotimme-tampere');
  cachedDb = db;
  return db;
}

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle OPTIONS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const db = await connectToDatabase();
    const sessions = db.collection('sessions');
    const stats = db.collection('stats');

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const { sessionId } = body;
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      // Update session
      if (sessionId) {
        await sessions.updateOne(
          { sessionId },
          { 
            $set: { 
              sessionId,
              lastActivity: now,
            }
          },
          { upsert: true }
        );

        // Update daily stats
        await stats.updateOne(
          { date: today },
          { 
            $inc: { totalVisitors: 1 },
            $setOnInsert: { createdAt: now }
          },
          { upsert: true }
        );

        // Update total counter
        await stats.updateOne(
          { _id: 'total' },
          { $inc: { count: 1 } },
          { upsert: true }
        );
      }

      // Clean old sessions
      const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
      await sessions.deleteMany({ 
        lastActivity: { $lt: fiveMinutesAgo } 
      });
    }

    // Get stats
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const onlineCount = await sessions.countDocuments({
      lastActivity: { $gte: fiveMinutesAgo }
    });

    const totalDoc = await stats.findOne({ _id: 'total' });
    const totalVisitors = totalDoc?.count || 0;

    const today = new Date().toISOString().split('T')[0];
    const todayDoc = await stats.findOne({ date: today });
    const todayVisitors = todayDoc?.totalVisitors || 0;

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        online: onlineCount,
        total: totalVisitors,
        today: todayVisitors,
        timestamp: new Date()
      }),
    };

  } catch (error) {
    console.error('Error:', error);

    // Return demo data on error
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: false,
        online: Math.floor(Math.random() * 20) + 5,
        total: 45678,
        today: 127,
        demo: true,
        error: error.message
      }),
    };
  }
};