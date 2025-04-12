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
const logger = require('./logger');
const statsd = require('./metrics');
app.use(express.json());
app.use((req, res, next) => {
  logger.info(`Request received: ${req.method} ${req.url}`, {
    method: req.method,
    url: req.url,
    query: req.query,
    body: req.body,
  });
  next();
});
app.use('/healthz', (req, res, next) => {
    if (Object.keys(req.query).length>0) {
      logger.warn('Invalid request to /healthz: Query or body parameters provided');
       return res.status(400).json();
     }
     if(Object.keys(req.body).length>0){
      logger.warn('Invalid request to /healthz: Query or body parameters provided');
        return res.status(400).json()
     }
     req.on("data", function(){
      logger.warn('Invalid request to /healthz: Body content provided');
        return res.status(400).json()
     })
    next();
});
// Add this simple endpoint towards the end of your app.js file



app.head('/healthz', (req, res) => {
  logger.warn('HEAD request to /healthz is not allowed');
  res.status(405).json();
});

app.get('/healthz', async (req, res) => {
  try {
    const start = Date.now();
      res.set("Pragma", "no-cache");
    res.set("X-Content-Type-Options", "nosniff");      
    res.set("Cache-Control", "no-cache, no-store, must-revalidate;");
  await sequelize.authenticate()
    await HealthCheck.create({});
    logger.info('Health check successful');
    statsd.increment('api.calls.healthz');
    const duration = Date.now() - start;
    statsd.timing('api.response_time.healthz', duration);
    res.status(200).json();
  } catch (err) {
    logger.error('Health check failed', { error: err.message, stack: err.stack });
      res.status(503).json();
  }
});

app.all('/healthz', (req, res) => { 
  logger.warn(`Invalid method ${req.method} for /healthz`);
  res.status(405).json();
});

// app.use('/cicd', (req, res, next) => {
//   if (Object.keys(req.query).length>0) {
//     logger.warn('Invalid request to /healthz: Query or body parameters provided');
//      return res.status(400).json();
//    }
//    if(Object.keys(req.body).length>0){
//     logger.warn('Invalid request to /healthz: Query or body parameters provided');
//       return res.status(400).json()
//    }
//    req.on("data", function(){
//     logger.warn('Invalid request to /healthz: Body content provided');
//       return res.status(400).json()
//    })
//   next();
// });


// app.head('/cicd', (req, res) => {
// logger.warn('HEAD request to /healthz is not allowed');
// res.status(405).json();
// });

// app.get('/cicd', async (req, res) => {
// try {
//   const start = Date.now();
//     res.set("Pragma", "no-cache");
//   res.set("X-Content-Type-Options", "nosniff");      
//   res.set("Cache-Control", "no-cache, no-store, must-revalidate;");
// await sequelize.authenticate()
//   await HealthCheck.create({});
//   logger.info('Health check successful');
//   statsd.increment('api.calls.healthz');
//   const duration = Date.now() - start;
//   statsd.timing('api.response_time.healthz', duration);
//   res.status(200).json();
// } catch (err) {
//   logger.error('Health check failed', { error: err.message, stack: err.stack });
//     res.status(503).json();
// }
// });

// app.all('/cicd', (req, res) => { 
// logger.warn(`Invalid method ${req.method} for /healthz`);
// res.status(405).json();
// });


app.head('/v1/file', (req, res) => {
  logger.warn(`Invalid method ${req.method} for /v1/file`);
  res.status(405).json(); // Method Not Allowed
});

// Handle HEAD /v1/file/:id
app.head('/v1/file/:id', (req, res) => {
  logger.warn(`Invalid method ${req.method} for /v1/file/:id`);
  res.status(405).json(); // Method Not Allowed
});

app.post('/v1/file', upload.single('profilePic'), async (req, res) => {
  const apiStart = Date.now();
  console.log("here")

  try {
      if (!req.file) {
        logger.warn('No file provided in /v1/file request');
        statsd.increment('api.calls.v1.file');
      statsd.timing('api.response_time.v1.file', Date.now() - apiStart);
          return res.status(400).json();
      }
      await sequelize.authenticate();
      const dbAuthStart = Date.now();
      statsd.timing('db.query.authenticate', Date.now() - dbAuthStart);
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
      const s3Start = Date.now();
    const s3Response = await s3.upload(params).promise();
    statsd.timing('s3.upload', Date.now()-s3Start);

      // Upload file to S3

      // Save file metadata to the database
      const fileUrl = `${process.env.S3_BUCKET_NAME}/${key}`;
      const dbCreateStart=Date.now()
      const file = await File.create({
          id: fileId,
          file_name: req.file.originalname,
          url: fileUrl, // S3 object URL
          upload_date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
      });
      logger.info('File uploaded successfully', { fileId, fileName: req.file.originalname });
      statsd.timing('db.query.file_create', Date.now() - dbCreateStart);
      statsd.increment('api.calls.v1.file');
    statsd.timing('api.response_time.v1.file', Date.now() - apiStart);    
      res.status(201).json({
          file_name: file.file_name,
          id: file.id,
          url: file.url,
          upload_date: file.upload_date,
      });
    
  } catch (error) {
    console.log(error)
    logger.error('File upload failed', { error: error.message, stack: error.stack });
    statsd.increment('api.calls.v1.file.error');
    statsd.timing('api.response_time.v1.file', Date.now() - apiStart);
      res.status(503).json();
  }
});

app.get('/v1/file', (req, res) => {
  logger.warn('Invalid request to /v1/file');
  res.status(400).json(); // Bad Request
});

app.get('/v1/file/:id', async (req, res) => {
  const apiStart = Date.now();
  try {
    const dbAuthStart = Date.now();
    await sequelize.authenticate();
    statsd.timing('db.query.authenticate', Date.now() - dbAuthStart);
    const dbFetchStart = Date.now();
    const file = await File.findByPk(req.params.id);
    statsd.timing('db.query.file_fetch', Date.now() - dbFetchStart);
      if (!file) {
        logger.warn(`File not found with ID: ${req.params.id}`);
        statsd.increment('api.calls.v1.file.get'); // Count the API call
      statsd.timing('api.response_time.v1.file.get', Date.now() - apiStart);
          return res.status(404).json();
      }
      logger.info('File retrieved successfully', { fileId: file.id, fileName: file.file_name });
      statsd.increment('api.calls.v1.file.get'); // Count the API call
    statsd.timing('api.response_time.v1.file.get', Date.now() - apiStart);
      res.status(200).json({
          file_name: file.file_name,
          id: file.id,
          url: file.url,
          upload_date: file.upload_date,
      });
  } catch (error) {
    logger.error('File retrival failed', { error: error.message, stack: error.stack });
    statsd.increment('api.calls.v1.file.get.error');
    statsd.timing('api.response_time.v1.file.get', Date.now() - apiStart);
      res.status(503).json();
    }
});

app.delete('/v1/file', (req, res) => {
  logger.warn('Invalid request to /v1/file');
  res.status(400).json(); // Bad Request
});

// DELETE /v1/file/:id (with parameters)
app.delete('/v1/file/:id', async (req, res) => {
  console.log('here')
  const apiStart = Date.now();
  try {
    const dbAuthStart = Date.now();
    await sequelize.authenticate();
    statsd.timing('db.query.authenticate', Date.now() - dbAuthStart);

    // Time the file lookup
    const dbFindStart = Date.now();
    const file = await File.findByPk(req.params.id);
    statsd.timing('db.query.file_fetch', Date.now() - dbFindStart);
      if (!file) {
        logger.warn(`File not found with ID: ${req.params.id}`);
        statsd.increment('api.calls.v1.file.delete');
      statsd.timing('api.response_time.v1.file.delete', Date.now() - apiStart);
          return res.status(404).json();
      }

      // Construct the S3 key using the file ID and file name
      const key = `${file.id}/${file.file_name}`;
      const s3DeleteStart=Date.now()

      // Delete file from S3
      await s3.deleteObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key, // Use the correct key
      }).promise();
      statsd.timing('s3.delete', Date.now() - s3DeleteStart);

      // Delete file metadata from the database
      const dbDestroyStart=Date.now()
      await file.destroy();
      statsd.timing('db.query.file_delete', Date.now() - dbDestroyStart);
      logger.info('File deleted successfully', { fileId: file.id, fileName: file.file_name });
      statsd.increment('api.calls.v1.file.delete');
    statsd.timing('api.response_time.v1.file.delete', Date.now() - apiStart);
      res.status(204).send(); // No content response for successful deletion
  } catch (error) {
    console.log(error)
    logger.error('File deletion failed', { error: error.message, stack: error.stack });
    statsd.increment('api.calls.v1.file.delete.error');
    statsd.timing('api.response_time.v1.file.delete', Date.now() - apiStart);
      res.status(503).json();
  }
});


app.all('/v1/file', (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
    logger.warn('Invalid request to /v1/file');  
    res.status(405).json(); // Method Not Allowed
  }
});

app.all('/v1/file/:id', (req, res) => {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    logger.warn('Invalid request to /v1/file/:id');  
    res.status(405).json();
  }
});

app.head('/v1/file/:id', (req, res) => {
  logger.warn('Invalid request to /v1/file/:id');  
  res.status(405).json(); // Method Not Allowed
});

// Handle OPTIONS /v1/file/:id
app.options('/v1/file/:id', (req, res) => {
  logger.warn('Invalid request to /v1/file/:id');  
  res.status(405).json(); // Method Not Allowed
});

// Handle PATCH /v1/file/:id
app.patch('/v1/file/:id', (req, res) => {
  logger.warn('Invalid request to /v1/file/:id');  
  res.status(405).json(); // Method Not Allowed
});

// Handle PUT /v1/file/:id
app.put('/v1/file/:id', (req, res) => {
  logger.warn('Invalid request to /v1/file/:id');  
  res.status(405).json(); // Method Not Allowed
});

// Handle POST /v1/file/:id
app.post('/v1/file/:id', (req, res) => {
  logger.warn('Invalid request to /v1/file/:id');  
  res.status(405).json(); // Method Not Allowed
});

app.use((req, res) => {
  logger.warn(`Invalid route accessed: ${req.method} ${req.url}`);
  res.status(400).json(); // Bad Request
});

module.exports = {app:app, port_listen:port_listen};