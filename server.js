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

app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/index.html'));
});

app.use('/script.js', express.static(path.join(__dirname, 'public/script.js'), {
  'Content-Type': 'application/javascript'
}));

const whiteboardChannel = ably.channels.get('whiteboardChannel');

io.on('connection', (socket) => {
  const userId = socket.id;
  whiteboardChannel.subscribe('message', (message) => {
    io.emit('message', message.data);
  });

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
