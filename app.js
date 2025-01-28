const express = require('express');
const app = express();
//const HealthCheck = require('./models/healthCheck');
const port = process.env.PORT || 8080;
app.listen(port)
app.use(express.json());
app.get('/healthz', async (req, res) => {
    try {
      //await HealthCheck.create({});
  
      res.set('Cache-Control', 'no-cache, no-store');
      res.status(200).json();
    } catch (err) {
      console.error('Database insert failed:', err);
      res.status(503).send('Service Unavailable');
    }
  });
app.all('/healthz', (req, res) => {
    res.status(405).send('Method Not Allowed');
});
app.use('/healthz', (req, res, next) => {
    if (req.body || req.query) {
      return res.status(400).send('Bad Request');
    }
    next();
});
  
  