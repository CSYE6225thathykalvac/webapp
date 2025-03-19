const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const File = require('./models/file');
const express = require('express');
const app = express();
const HealthCheck = require('./models/healthCheck');
const sequelize = require('./config/db');
const sequelize = require('./sequelize');
const port = process.env.PORT || 8080;
const port_listen = app.listen(port)
const s3 = new AWS.S3();
const upload = multer({ storage: multer.memoryStorage() });
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

app.head('/healthz', (req, res) => {
  res.status(405).json();
});

app.post('/v1/file', upload.single('profilePic'), async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json({ error: 'No file uploaded' });
      }

      const fileId = uuidv4();
      const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: fileId,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          Metadata: {
              originalName: req.file.originalname,
          },
      };

      // Upload file to S3
      const s3Response = await s3.upload(params).promise();

      // Save file metadata to the database
      const file = await File.create({
          id: fileId,
          file_name: req.file.originalname,
          url: s3Response.Location, // S3 object URL
          upload_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      });

      res.status(201).json({
          file_name: file.file_name,
          id: file.id,
          url: file.url,
          upload_date: file.upload_date,
      });
  } catch (error) {
      console.error('Error uploading file:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.get('/v1/file/:id', async (req, res) => {
  try {
      const file = await File.findByPk(req.params.id);
      if (!file) {
          return res.status(404).json({ error: 'File not found' });
      }
      await sequelize.authenticate();
      res.status(200).json({
          file_name: file.file_name,
          id: file.id,
          url: file.url,
          upload_date: file.upload_date,
      });
  } catch (error) {
      console.error('Error retrieving file metadata:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.delete('/v1/file/:id', async (req, res) => {
  try {
      const file = await File.findByPk(req.params.id);
      if (!file) {
          return res.status(404).json({ error: 'File not found' });
      }

      // Delete file from S3
      await s3.deleteObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: file.id,
      }).promise();

      // Delete file metadata from the database
      await file.destroy();

      res.status(204).send();
  } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
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
app.use((req, res) => {
  res.status(400).json();
});

app.all('/v1/file', (req, res) => {
  if (req.method !== 'POST') {
      res.status(405).json();
  }
});

app.all('/v1/file/:id', (req, res) => {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
      res.status(405).json();
  }
});

module.exports = {app:app, port_listen:port_listen};