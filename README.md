# webapp- Assignment 1

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

# webapp- Assignment 2

## Automating Application Setup with Shell Script
1. create account in `digitalocean` and connect using `ssh`
2. create a `droplet` in digital ocean
3. use `ssh -i C:\Users\charan\.ssh\do root@public_ip`to connect local command shell with droplet
4. upload zip folder to `csye6225` using `scp -i ~/.ssh/do ~/Downloads/webapp.zip root@165.227.86.188:/opt/csye6225/` in git bash
5. create 2 files namely `setup.sh` and `.env`
6. write the automation commands in setup.sh
7. we can execute the files using `bash setup.sh` or `.\setup.sh` 

## Implement API Testing
1. we use `supertest` to test the api functionality
2. we have to install modules such as `jest` and `supertest` using `npm install`
3. write test cases for `200 OK`, `405 Method Not Allowed`, `400 Bad Request` and `503 Service Unavailable`
4. we can run the test cases using `npx jest` command