const express = require('express');
const path = require('path');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');

require('dotenv').config(); // Vercelissä voit asettaa environment variables

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// MongoDB yhteys
const mongoUri = process.env.MONGO_URI; // Lisää Vercel dashboardissa
mongoose.connect(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Staattisten tiedostojen tarjoaminen
app.use(express.static(path.join(__dirname, 'public')));

// Esimerkkireitti tietokantaan
app.get('/users', async (req, res) => {
  try {
    const users = await mongoose.connection.db.collection('users').find().toArray();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Kaikki muut pyynnöt palauttavat index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.io
io.on('connection', (socket) => {
  console.log('User connected');

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
