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
  const start = Date.now();
  const path = req.path.replace(/\//g, '_').substring(1) || 'root';
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    statsd.timing(`api.${req.method.toLowerCase()}.${path}.response_time`, duration);
    statsd.increment(`api.${req.method.toLowerCase()}.${path}.count`);
    
    logger.info(`Request received: ${req.method} ${req.url}`, {
      method: req.method,
      url: req.url,
      query: req.query,
      body: req.body,
      duration: duration
    });
  });
  
  next();
});
const timedQuery = async (queryFn, queryName) => {
  const start = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - start;
    statsd.timing(`database.${queryName}.query_time`, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    statsd.timing(`database.${queryName}.query_time`, duration);
    throw error;
  }
};
const timedS3Operation = async (operationFn, operationName) => {
  const start = Date.now();
  try {
    const result = await operationFn();
    const duration = Date.now() - start;
    statsd.timing(`s3.${operationName}.operation_time`, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    statsd.timing(`s3.${operationName}.operation_time`, duration);
    throw error;
  }
};
app.use('/healthz', (req, res, next) => {
  if (Object.keys(req.query).length>0) {
    logger.warn('Invalid request to /healthz: Query or body parameters provided');
    statsd.increment('api.healthz.invalid_request');
    return res.status(400).json();
   }
   if(Object.keys(req.body).length>0){
    logger.warn('Invalid request to /healthz: Query or body parameters provided');
    statsd.increment('api.healthz.invalid_request');
    return res.status(400).json()
   }
   req.on("data", function(){
    logger.warn('Invalid request to /healthz: Body content provided');
    statsd.increment('api.healthz.invalid_request');
    return res.status(400).json()
   })
  next();
});

app.head('/healthz', (req, res) => {
  logger.warn('HEAD request to /healthz is not allowed');
  statsd.increment('api.healthz.method_not_allowed');
  res.status(405).json();
});

app.get('/healthz', async (req, res) => {
  try {
      res.set("Pragma", "no-cache");
      res.set("X-Content-Type-Options", "nosniff");      
      res.set("Cache-Control", "no-cache, no-store, must-revalidate;");
      
      await timedQuery(() => sequelize.authenticate(), 'authenticate');
      
      await timedQuery(() => HealthCheck.create({}), 'healthcheck_create');
      
      logger.info('Health check successful');
      statsd.increment('api.healthz.success');
      res.status(200).json();
  } catch (err) {
    logger.error('Health check failed', { error: err.message, stack: err.stack });
    statsd.increment('api.healthz.failure');
    res.status(503).json();
  }
});

app.all('/healthz', (req, res) => { 
  logger.warn(`Invalid method ${req.method} for /healthz`);
  statsd.increment('api.healthz.method_not_allowed');
  res.status(405).json();
});

app.head('/v1/file', (req, res) => {
  logger.warn(`Invalid method ${req.method} for /v1/file`);
  statsd.increment('api.file.method_not_allowed');
  res.status(405).json();
});

app.head('/v1/file/:id', (req, res) => {
  logger.warn(`Invalid method ${req.method} for /v1/file/:id`);
  statsd.increment('api.file.id.method_not_allowed');
  res.status(405).json();
});

app.post('/v1/file', upload.single('profilePic'), async (req, res) => {
  try {
      if (!req.file) {
        logger.warn('No file provided in /v1/file request');
        statsd.increment('api.file.invalid_request');
        return res.status(400).json();
      }
      
      await timedQuery(() => sequelize.authenticate(), 'authenticate');
      
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
      const s3Response = await timedS3Operation(
        () => s3.upload(params).promise(),
        'upload'
      );

      // Save file metadata to the database with timing
      const fileUrl = `${process.env.S3_BUCKET_NAME}/${key}`;
      const file = await timedQuery(
        () => File.create({
          id: fileId,
          file_name: req.file.originalname,
          url: fileUrl,
          upload_date: new Date().toISOString().split('T')[0],
        }),
        'file_create'
      );
      logger.info('File uploaded successfully', { fileId, fileName: req.file.originalname });
      statsd.increment('api.file.success');
      res.status(201).json({
          file_name: file.file_name,
          id: file.id,
          url: file.url,
          upload_date: file.upload_date,
      });
  } catch (error) {
    logger.error('File upload failed', { error: error.message, stack: error.stack });
    statsd.increment('api.file.failure');
    res.status(503).json();
  }
});
    
app.get('/v1/file', (req, res) => {
  logger.warn('Invalid request to /v1/file');
  statsd.increment('api.file.invalid_request');
  res.status(400).json();
});


app.get('/v1/file/:id', async (req, res) => {
  try {
      await timedQuery(() => sequelize.authenticate(), 'authenticate');
      
      const file = await timedQuery(
        () => File.findByPk(req.params.id),
        'file_find'
      );
      
      if (!file) {
        logger.warn(`File not found with ID: ${req.params.id}`);
        statsd.increment('api.file.id.not_found');
        return res.status(404).json();
      }
            
      logger.info('File retrieved successfully', { fileId: file.id, fileName: file.file_name });
      statsd.increment('api.file.id.success');
      res.status(200).json({
          file_name: file.file_name,
          id: file.id,
          url: file.url,
          upload_date: file.upload_date,
      });
  } catch (error) {
    logger.error('File retrival failed', { error: error.message, stack: error.stack });
    statsd.increment('api.file.id.failure');
    res.status(503).json();
  }
});

app.delete('/v1/file', (req, res) => {
  logger.warn('Invalid request to /v1/file');
  statsd.increment('api.file.invalid_request');
  res.status(400).json();
});

// DELETE /v1/file/:id (with parameters)
app.delete('/v1/file/:id', async (req, res) => {
  try {
      await timedQuery(() => sequelize.authenticate(), 'authenticate');
      
      const file = await timedQuery(
        () => File.findByPk(req.params.id),
        'file_find'
      );
      
      if (!file) {
        logger.warn(`File not found with ID: ${req.params.id}`);
        statsd.increment('api.file.id.not_found');
        return res.status(404).json();
      }

      const key = `${file.id}/${file.file_name}`;

      // Delete file from S3 with timing
      await timedS3Operation(
        () => s3.deleteObject({
          Bucket: process.env.S3_BUCKET_NAME,
          Key: key,
        }).promise(),
        'delete'
      );
      
      // Delete file metadata from the database with timing
      await timedQuery(() => file.destroy(), 'file_destroy');
      
      logger.info('File deleted successfully', { fileId: file.id, fileName: file.file_name });
      statsd.increment('api.file.id.success');
      res.status(204).send();
  } catch (error) {
    logger.error('File deletion failed', { error: error.message, stack: error.stack });
    statsd.increment('api.file.id.failure');
    res.status(503).json();
  }
});


app.all('/v1/file', (req, res) => {
  if (req.method !== 'POST' && req.method !== 'GET' && req.method !== 'DELETE') {
    logger.warn('Invalid request to /v1/file');  
    statsd.increment('api.file.method_not_allowed');
    res.status(405).json(); // Method Not Allowed
  }
});

app.all('/v1/file/:id', (req, res) => {
  if (req.method !== 'GET' && req.method !== 'DELETE') {
    logger.warn('Invalid request to /v1/file/:id');  
    statsd.increment('api.file.id.method_not_allowed');
    res.status(405).json();
  }
});

app.head('/v1/file/:id', (req, res) => {
  logger.warn('Invalid request to /v1/file/:id'); 
  statsd.increment('api.file.id.method_not_allowed'); 
  res.status(405).json(); // Method Not Allowed
});

// Handle OPTIONS /v1/file/:id
app.options('/v1/file/:id', (req, res) => {
  logger.warn('Invalid request to /v1/file/:id');  
  statsd.increment('api.file.id.method_not_allowed');
  res.status(405).json(); // Method Not Allowed
});

// Handle PATCH /v1/file/:id
app.patch('/v1/file/:id', (req, res) => {
  logger.warn('Invalid request to /v1/file/:id');  
  statsd.increment('api.file.id.method_not_allowed');
  res.status(405).json(); // Method Not Allowed
});

// Handle PUT /v1/file/:id
app.put('/v1/file/:id', (req, res) => {
  logger.warn('Invalid request to /v1/file/:id');  
  statsd.increment('api.file.id.method_not_allowed');
  res.status(405).json(); // Method Not Allowed
});

// Handle POST /v1/file/:id
app.post('/v1/file/:id', (req, res) => {
  logger.warn('Invalid request to /v1/file/:id');  
  statsd.increment('api.file.id.method_not_allowed');
  res.status(405).json(); // Method Not Allowed
});

app.use((req, res) => {
  logger.warn(`Invalid route accessed: ${req.method} ${req.url}`);
  statsd.increment('api.invalid_route');
  res.status(400).json(); // Bad Request
});

module.exports = {app:app, port_listen:port_listen};