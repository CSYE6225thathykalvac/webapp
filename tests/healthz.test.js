const request = require('supertest');
const app = require('../app'); // Import your Express app
const sequelize = require('../config/db'); // Import the database connection
if (process.env.NODE_ENV !== 'test') {
    app.listen(port); // Only listen if not in test mode
  }
describe('GET /healthz', () => {
  
  // Test 1: Success case - Database is running
  it('should return 200 OK when database is up', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
    expect(res.headers['cache-control']).toBe('no-cache');
  });

  // Test 2: Failure case - Database is down
  it('should return 503 Service Unavailable when database is down', async () => {
    // Temporarily disconnect the DB to simulate failure
    await sequelize.close(); // Close DB connection
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(503);
    await sequelize.authenticate(); // Reconnect DB after test
  });

  // Test 3: Method Not Allowed - Check if other methods are blocked
  it('should return 405 Method Not Allowed for POST requests', async () => {
    const res = await request(app).post('/healthz');
    expect(res.status).toBe(405);
  });

  it('should return 405 Method Not Allowed for PUT requests', async () => {
    const res = await request(app).put('/healthz');
    expect(res.status).toBe(405);
  });

  it('should return 405 Method Not Allowed for DELETE requests', async () => {
    const res = await request(app).delete('/healthz');
    expect(res.status).toBe(405);
  });

  it('should return 405 Method Not Allowed for PATCH requests', async () => {
    const res = await request(app).patch('/healthz');
    expect(res.status).toBe(405);
  });

  // Test 4: Bad Request - Request with payload (body)
  it('should return 400 Bad Request when a payload is sent', async () => {
    const res = await request(app).get('/healthz').send({ test: 'payload' });
    expect(res.status).toBe(400);
  });

  // Test 5: Bad Request - Unknown endpoint
  it('should return 400 Bad Request for unknown endpoints', async () => {
    const res = await request(app).get('/healthzee'); // Misspelled endpoint
    expect(res.status).toBe(400);
  });

});
module.exports = app;