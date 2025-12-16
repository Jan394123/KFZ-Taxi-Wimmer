const express = require('express');
const path = require('path');

const server = express();
const PORT = process.env.PORT || 3000;

// Static files (HTML, CSS, JS, images, PDFs)
server.use(express.static(__dirname));
server.use('/content', express.static(path.join(__dirname, 'content')));
server.use('/img', express.static(path.join(__dirname, 'img')));

// Fallback to index.html for root
server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

server.listen(PORT, () => {});
