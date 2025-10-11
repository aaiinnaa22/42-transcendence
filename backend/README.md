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

The database will consist of two different tables. One for user data, another for player statistics.

```prisma
model User {
    id              String      @id @default(uuid())
    googleId        String      @unique
    email           String      @unique
    username        String?
    avatarUrl       String?
    createdAt       DateTime    @default(now())
    updatedAt       DateTime    @updatedAt
    lastLogin       DateTime?

    playerStats     PlayerStats?
}
```

```prisma
model PlayerStats {
    userId          String      @id
    wins            Int         @default(0)
    losses          Int         @default(0)
    playedGames     Int         @default(0)
    eloRating       Int         @default(1200)

    user            User        @relation(fields: [userId], references: [id])
}
```


### TODOs
- Implement an API which is able to communicate with the database.
- Implement SQLite database which stores client information (UUID, Google ID, username, email, creation date, last login), and tournament information (wins/losses, rank).
- Utilize oauth2 for authentication in order to avoid salting + hashing passwords in the database ourselves.
- Make the game server-authoritative by moving game logic to the backend.
- Switch to secure connections (https).
- Switch request schema with JWT for session management and authentication.
- Implement schemas for game data streaming.
