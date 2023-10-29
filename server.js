const express = require('express');
const Ably = require('ably');
const path = require('path');
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
const envConfig = require('dotenv').config();

const { ABLY_API_KEY } = envConfig.parsed;

const ably = new Ably.Realtime({
  key: ABLY_API_KEY,
  echoMessages: false
});

// Serve static files (e.g., CSS, JavaScript, etc.) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

// Serve the index.html file directly for the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Set the correct MIME type for JavaScript files
app.use('/script.js', express.static(path.join(__dirname, 'public/script.js'), { 'Content-Type': 'application/javascript' }));

const whiteboardChannel = ably.channels.get('whiteboardChannel');

io.on('connection', (socket) => {
  const userId = socket.id;
  //whiteboardChannel.presence.enter(userId);
  whiteboardChannel.subscribe('message', (message) => {
    io.emit('message', message.data);
  });
  // socket.on('drawing', (data) => {
  //   // Broadcast the drawing data to all connected clients via Ably
  //   whiteboardChannel.publish('drawing', data);
  // });

  whiteboardChannel.subscribe('drawing', (message) => {
    const data = message.data;
    io.emit('drawing', data);
  });

  socket.on('disconnect', () => {
    whiteboardChannel.presence.leave(userId);
  });
});

http.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + (process.env.PORT || 3000));
});
