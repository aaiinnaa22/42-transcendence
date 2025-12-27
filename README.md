# A GAME OF PONG - TRANSCENDENCE

In this repository you will find **the transcendence**, an full stack implementation of a game of PONG, done at Hive Helsinki (42 Network school) by our team of 5:

- [Aina Aalbrecht](https://github.com/aaiinnaa22)
- [Fred Pikkov](https://github.com/fpikkov)
- [Hanna Skrzypiec](https://github.com/huskyhania)
- [Leo Laaksonen](https://github.com/llaakson)
- [Chi Lee](https://github.com/LeeRichi)

This is the final project of 42 curriculum, where we abandon C and C++ and learn completely new languages, frameworks and technologies (Javascript, Typescript, React, Tailwind CSS, Fastify, among others).

## Project scope, modules & technologies
As part of the ft_transcendence project of the 42 curriculum, we defined the scope of our application by selecting the following modules and implementing them using the technologies required by the subject.

**Frontend**

- Built as a Single Page Application (SPA) using TypeScript.

- Implemented with a frontend framework/toolkit (React) and styled with Tailwind CSS.

- Designed to be responsive, supporting all devices and multiple browsers.

- Includes multiple language support for accessibility.

**Backend**

- Developed using Node.js with the Fastify framework.

- Handles authentication, real-time gameplay, chat, and API endpoints.

**Database** 

- Uses SQLite, the database mandated by the subject for backend persistence.

- Stores user information, statistics and secured credentials.

**User Management & Authentication**

- Standard user management including registration, login, profiles, avatars, friends, and match history.

- Remote authentication implemented via a third-party provider (Google Auth).

- JWT-based authentication used for secure session handling.

- Two-Factor Authentication (2FA) with an authenticator application added as an extra security layer.

**Gameplay & Networking**

- Server-side Pong implementation to ensure fair and synchronized gameplay.

- Real-time gameplay communication implemented using secure WebSockets (WSS).

- Exposed through a secure API.

- Supports remote players with real-time multiplayer functionality and matchmaking.

**Live Chat**

- Integrated real-time chat system using secure WebSockets.

- Allows direct messages, game invitations, and tournament/match notifications.


**Security & Deployment**

- Passwords are securely hashed and all sensitive configuration is managed via environment variables.

- The entire application runs inside Docker containers, launched with a single command, as required by the subject.

This project scope emphasizes full-stack development, real-time communication and security, while strictly respecting the technical constraints and module requirements defined in the ft_transcendence subject.

## How to launch

1. Clone the repository
2. Go to backend directory and create .env file
3. Add three below secrets and the credentials for Google Authentication:
```
JWT_SECRET=supersecret
COOKIE_SECRET=cookiesecret
LOG_SECRET=logsecret

GOOGLE_CLIENT_ID=yourgoogleclientid
GOOGLE_CLIENT_SECRET=yourgoogleclientsecret
```
4. Go back to the root directory
5. If you want to enable remote player connections from other computers, replace "localhost" in docker-compose.prod.yml with your address
6. Build and run the project using command ```make eval```
7. Go to the website, for example ```https://localhost:8443``` or ```https://your-domain:8443```
8. Enjoy a game of PONG!
