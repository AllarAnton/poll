import express from 'express';
import bodyParser from 'body-parser';
import dotenv from 'dotenv';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

import topicsRoutes from './routes/topics.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
dotenv.config();

const PORT = process.env.PORT;

app.use(bodyParser.json());
app.use(cors())
app.use(cookieParser());

app.use('/', (req, res, next) => {
  const user = req.cookies.token;
  const access = req.query.token || '';
  
  if ((access === process.env.ACCESS_TOKEN && !user) || user) {
    if (!user) {
      res.cookie('token', crypto.randomUUID());
    }
    next();
  } else {
    res.status(401).sendFile(path.join(__dirname, '/401.html'));
  }
});

app.use('/topics', topicsRoutes);
app.use(express.static('public'));

app.listen(PORT, () => console.log(`Server running on: http:localhost:${PORT}`));