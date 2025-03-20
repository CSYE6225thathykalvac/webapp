const multer = require('multer');
const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const File = require('./models/file');
const express = require('express');
const app = express();
const HealthCheck = require('./models/healthCheck');
const sequelize = require('./config/db');
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

app.head('/v1/file', (req, res) => {
  res.status(405).json(); // Method Not Allowed
});

// Handle HEAD /v1/file/:id
app.head('/v1/file/:id', (req, res) => {
  res.status(405).json(); // Method Not Allowed
});

app.post('/v1/file', upload.single('profilePic'), async (req, res) => {
  try {
      if (!req.file) {
          return res.status(400).json();
      }

      const fileId = uuidv4();
      const key = `${fileId}/${req.file.originalname}`;
      const params = {
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
          Body: req.file.buffer,
          ContentType: req.file.mimetype,
          Metadata: {
              originalName: req.file.originalname,
          },
      };

      // Upload file to S3
      const s3Response = await s3.upload(params).promise();

      // Save file metadata to the database
      const fileUrl = `${process.env.S3_BUCKET_NAME}/${key}`;
      const file = await File.create({
          id: fileId,
          file_name: req.file.originalname,
          url: fileUrl, // S3 object URL
          upload_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      });

      res.status(201).json({
          file_name: file.file_name,
          id: file.id,
          url: file.url,
          upload_date: file.upload_date,
      });
  } catch (error) {
      res.status(500).json();
  }
});

app.get('/v1/file', (req, res) => {
  res.status(400).json(); // Bad Request
});

app.get('/v1/file/:id', async (req, res) => {
  try {
      const file = await File.findByPk(req.params.id);
      if (!file) {
          return res.status(404).json();
      }

      res.status(200).json({
          file_name: file.file_name,
          id: file.id,
          url: file.url,
          upload_date: file.upload_date,
      });
  } catch (error) {
      res.status(500).json();
  }
});

app.delete('/v1/file', (req, res) => {
  res.status(400).json(); // Bad Request
});

// DELETE /v1/file/:id (with parameters)
app.delete('/v1/file/:id', async (req, res) => {
  try {
      const file = await File.findByPk(req.params.id);
      if (!file) {
          return res.status(404).json();
      }

      // Construct the S3 key using the file ID and file name
      const key = `${file.id}/${file.file_name}`;

      // Delete file from S3
      await s3.deleteObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key, // Use the correct key
      }).promise();

      // Delete file metadata from the database
      await file.destroy();

      res.status(204).send(); // No content response for successful deletion
  } catch (error) {
      console.error('Error deleting file:', error);
      res.status(500).json(); // Internal Server Error
  }
});


app.all('/v1/file', (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
      res.status(405).json(); // Method Not Allowed
  }
});

app.all('/v1/file/:id', (req, res) => {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
      res.status(405).json();
  }
});

app.head('/v1/file/:id', (req, res) => {
  res.status(405).json(); // Method Not Allowed
});

// Handle OPTIONS /v1/file/:id
app.options('/v1/file/:id', (req, res) => {
  res.status(405).json(); // Method Not Allowed
});

// Handle PATCH /v1/file/:id
app.patch('/v1/file/:id', (req, res) => {
  res.status(405).json(); // Method Not Allowed
});

// Handle PUT /v1/file/:id
app.put('/v1/file/:id', (req, res) => {
  res.status(405).json(); // Method Not Allowed
});

// Handle POST /v1/file/:id
app.post('/v1/file/:id', (req, res) => {
  res.status(405).json(); // Method Not Allowed
});

app.use((req, res) => {
  res.status(400).json(); // Bad Request
});

module.exports = {app:app, port_listen:port_listen};