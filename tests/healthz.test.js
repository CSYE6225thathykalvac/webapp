const request = require('supertest');
const {app} = require('../app'); 
const sequelize = require('../config/db');
const {port_listen} = require('../app');
beforeAll(async() => {
  await sequelize.authenticate()})
describe('GET /healthz', () => {
  
  it('should return 200 OK when database is up', async () => {
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(200);
  });

  it('should return 503 Service Unavailable when database is down', async () => {
    await sequelize.close(); 
    const res = await request(app).get('/healthz');
    expect(res.status).toBe(503);
  });

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

  it('should return 400 Bad Request for unknown endpoints', async () => {
    const res = await request(app).get('/healthzee'); 
    expect(res.status).toBe(400);
  });

});
afterAll(async () => {
    await sequelize.close();
    port_listen.close()
});
