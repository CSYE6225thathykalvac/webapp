# webapp- Assignment 1

## Prerequisites
- Node.js
- MySQL Database
- .env file with required DB credentials
- digital ocean account

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
4. upload zip folder to `csye6225` using `scp -i ~/.ssh/do ~/Downloads/webapp.zip root@public_ip:/opt/csye6225/` in git bash
5. create 2 files namely `setup.sh` and `.env`
6. write the automation commands in setup.sh
7. we can execute the files using `bash setup.sh` or `.\setup.sh` 

## Implement API Testing
1. we use `supertest` to test the api functionality
2. we have to install modules such as `jest` and `supertest` using `npm install`
3. write test cases for `200 OK`, `405 Method Not Allowed`, `400 Bad Request` and `503 Service Unavailable`
4. we can run the test cases using `npx jest` command

# webapp- Assignment 3 CI
- The workflow runs automatically on every **pull request** to the `main` branch.
## Build and Test
- **Runs on:** `ubuntu-latest`
- **Services:**
  - **MySQL (v8.0)** is started as a service container with credentials stored in **GitHub Secrets**.
## Steps:
1. **Checkout Code**: Fetches the latest code from the repository.
2. **Set Up Node.js**: Installs Node.js version 18.
3. **Install Dependencies**: Runs `npm install` to install project dependencies.
4. **Wait for MySQL**: Ensures the MySQL service is ready before running tests.
5. **Run Tests**: Executes Jest tests using the provided database credentials.