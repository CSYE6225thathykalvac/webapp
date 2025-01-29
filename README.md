# webapp

## Prerequisites
- Node.js
- MySQL Database
- .env file with required DB credentials

## Build & Deploy Instructions
1. Clone the repository.
2. Run `npm install` to install dependencies.
3. Set up the .env file with database credentials.
4. Run `node app.js` to start the server.
5. We can use `net stop MySQL92` and `net start MySQL92` to stop and start mysql server 

## API Endpoint
`GET / localhost:8080/healthz`
Responses: 
1. 200 OK: Database is connected and working
2. 503 service unavailable: Database connection failed
3. 400 Bad Request: Request contains a body
4. 405 Method Not Allowed: Invalied HTTP method

## Testing
- Use Postman or curl to test the /healthz endpoint.
- Curl command for testing: `curl -vvvv http://localhost:8080/healthz`
- For postman: `GET http://localhost:8080/healthz`