## Transencdence
If your system doe not have npm installed go to the [Node.js Download](https://nodejs.org/en/download) page and follow the steps.

Launch the backend server with:
```bash
cd backend
npm run dev
```

Test with curl:
```bash
curl 127.0.0.1:6000
```
Alternatively use the REST Client VSCode extension and test requests in a '.http' file.


### Backend Languages
- Javascript
- Typescript
- SQL
- JSON


### Backend Frameworks
- Node.js
- Fastify


### Backend Plugins
| Plugin			| Used for														|
|-------------------|---------------------------------------------------------------|
| @fastify-oauth2	| Google Authentication											|
| @fastify-jwt		| JSON Web Tokens												|
| uuid				| UUIDs for tracking existing users.							|
| nodemon			| Testing the backend with livereload.							|


### TODOs
- Implement an API which is able to communicate with the database.
- Implement SQLite database which stores client information (UUID, Google ID, username, email, creation date, last login), and tournament information (wins/losses, rank).
- Utilize oauth2 for authentication in order to avoid salting + hashing passwords in the database ourselves.
- Make the game server-authoritative by moving game logic to the backend.
- Switch to secure connections (https).
