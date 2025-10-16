# Transencdence
### Testing
If your system doe not have npm installed go to the [Node.js Download](https://nodejs.org/en/download) page and follow the steps.

Launch the backend server with:
```bash
cd backend
npm install
npm run dev
```

Test with curl:
```bash
curl 127.0.0.1:6000
```
Alternatively use the REST Client VSCode extension and test requests in a '.http' file.

When testing with the database create it first:
```bash
npm run dev-db-build
```

### Environmental Variables
To test the backend locally, create a `.env` file within the backend directory with the following variables:
| Variable				| Example										|
|-----------------------|-----------------------------------------------|
| DATABASE_URL			| file:./dev.db									|
| HOSTNAME				| 127.0.0.1 or 0.0.0.0							|
| PORT					| 4241											|
| NODE_ENV				| development									|
| JWT_SECRET			|												|
| GOOGLE_CLIENT_ID		| Create in Google Cloud Console				|
| GOOGLE_CLIENT_SECRET	| Create in Google Cloud Console				|
| GOOGLE_CALLBACK_URL	| http://localhost:4241/auth/google/callback	|

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

### Elo Rating System

The following formula can be used to calculate the player's new elo rating after a match with another player:
$$ R' = R + K \times (S - E) $$
R' == new rating\
R == old rating\
K == K-factor constant\
S == actual score ( 1 for a win, 0 for a loss )\
E == expected score

The value of E is calculated with a different formula:
$$ E = \frac{1}{1 + 10^{({R_{\text{opponent}} - R_{\text{player}}})/{400}}}​ $$

The K-factor can be set to 32 for simplicity. For more fair elo calculation check the following [reference](https://en.wikipedia.org/wiki/Elo_rating_system#Most_accurate_K-factor).\
The default rating of all new players is set to 1200.


### Database

The database will consist of multiple tables with relations to each other. A main table for an user which ties to authentication provider table(s) and/or local authentication details table. A default table is attached to the user which includes details on the games played by the given user.

The UUID is used within the JWT responses to authorize data access.


### TODOs
- Implement an API which is able to communicate with the database.
- Implement local account registration on the /auth/register route. Include hashed + salted credentials.
- Provide authenticated users with a JWT authoriztion token.
- Make the game server-authoritative by moving game logic to the backend.
- Switch to secure connections (https).
- Implement schemas for game data streaming.
