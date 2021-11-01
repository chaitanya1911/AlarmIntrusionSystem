const express = require('express')
const app = express();
const port = 8000;
const http = require('http')
app.get('/', (req, res) => {
  res.sendFile('D:/CHAITANYA/web/node/DC09/app.html')
});

app.listen(port, () => {
  console.log(`App listening on port ${port}!`)
});
