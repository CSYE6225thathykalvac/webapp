const express = require('express');
const app = express();
const HealthCheck = require('./models/healthCheck');
const sequelize = require('./config/db');
const port = process.env.PORT || 8080;
app.listen(port)
app.use(express.json());
app.use('/healthz', (req, res, next) => {
    if (Object.keys(req.query).length>0) {
       return res.status(400).json();
     }
     if(Object.keys(req.body).length>0){
        return res.status(400).json()
     }
     req.on("data", function(){
        return res.status(400).json()
     })
    next();
});
app.get('/healthz', async (req, res) => {
    try {
        res.set("Pragma", "no-cache");
      res.set("X-Content-Type-Options", "nosniff");      
      res.set("Cache-Control", "no-cache, no-store, must-revalidate;");
    await sequelize.authenticate()
      await HealthCheck.create({});
      
      res.status(200).json();
    } catch (err) {
        res.status(503).json();
    }
  });
app.all('/healthz', (req, res) => { 
    res.status(405).json();
});