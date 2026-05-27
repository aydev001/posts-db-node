const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const postRoutes = require('./routes/post.routes');
const { notFound, errorHandler } = require('./middlewares/error');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

const publicDir = path.join(__dirname, '..', 'public');
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use('/api/posts', postRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
