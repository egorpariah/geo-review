import express from 'express';
import { Storage } from './storage.mjs';

const PORT = process.env.PORT || 3000;
const server = express();
const storage = new Storage();

server.use(express.json());

server.use((req, res, next) => {
  console.log('>', req.method, req.originalUrl);

  res.set('Cache-Control', 'public, max-age=300, s-maxage=600');

  if (req.method === 'POST') {
    next();
  } else {
    res.status(200).json({});
  }
});

server.use('/coords', (req, res, next) => {
  res.status(200).json(storage.getCoords());
  next();
});

server.use('/add', (req, res, next) => {
  storage.add(req.body);
  res.status(200).json({ ok: true });
  next();
});

server.use('/list', (req, res, next) => {
  res.status(200).json(storage.getByCoords(req.body.coords));
  next();
});

server.use((err, req, res, next) => {
  res.status(500).json(err.message);
});

server.listen(PORT, () => {
  console.log(`server started on port ${PORT}`);
});
