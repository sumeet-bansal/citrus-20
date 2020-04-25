const express = require('express');

const server = express();

server.use(express.urlencoded({ extended: true }));
server.use(express.json());

server.get('/', (req, res, next) => {
  res.json({ hello: 'world' });
});

const port = 8000;
server.listen(port, () => {
  console.log(`listening on port ${port}`);
});
