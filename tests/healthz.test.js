const request = require('supertest');
const {app} = require('../app'); // Import your Express app
const sequelize = require('../config/db'); // Import the database connection
const {port_listen} = require('../app');
describe('GET /healthz', () => {
  
  // Test 1: Success case - Database is running
  it('should return 200 OK when database is up', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
  });

  // Test 2: Failure case - Database is down
  it('should return 503 Service Unavailable when database is down', async () => {
    await sequelize.close(); 
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(503);
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

  it('should return 405 Method Not Allowed for PATCH requests', async () => {
    const res = await request(app).head('/healthz');
    expect(res.status).toBe(405);
  });

  it('should return 405 Method Not Allowed for PATCH requests', async () => {
    const res = await request(app).options('/healthz');
    expect(res.status).toBe(405);
  });

  // Test 4: Bad Request - Request with payload (body)
  it('should return 400 Bad Request when a payload is sent', async () => {
    const res = await request(app).get('/healthz').send({ test: 'payload' });
    expect(res.status).toBe(400);
  });

  it('should return 400 Bad Request when a payload is sent', async () => {
    const res = await request(app).get('/healthz').send("Hello");
    expect(res.status).toBe(400);
  });

  it('should return 400 Bad Request when a payload is sent', async () => {
    const res = await request(app).get('/healthz').set('Content-Type', 'text/html').send("<html>Hello</html>");
    expect(res.status).toBe(400);
  });

  it('should return 400 Bad Request when a payload is sent', async () => {
    const res = await request(app).get('/healthz').set('Content-Type', 'application/x-www-form-urlencoded').send("Key and Value Pair");
    expect(res.status).toBe(400);
  });

  it('should return 400 Bad Request when a payload is sent', async () => {
    const res = await request(app).get("/healthz?a=10");
    expect(res.status).toBe(400);
  });

  // Test 5: Bad Request - Unknown endpoint
  it('should return 400 Bad Request for unknown endpoints', async () => {
    const res = await request(app).get('/healthzee'); // Misspelled endpoint
    expect(res.status).toBe(400);
  });

});
afterAll(async () => {
    await sequelize.close();
    port_listen.close()
});
