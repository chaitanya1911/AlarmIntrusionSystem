const express = require('express')
const app = express();
const port = 8000;
const http = require('http')

const socketio = require('socket.io')
const server = http.createServer(app);
const io = socketio(server);

app.get('/', (req, res) => {
  res.sendFile('D:/CHAITANYA/web/node/DC09/app.html')
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}!`)
});
