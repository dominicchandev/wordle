# Wordle Game README

## Overview
This project implements a Wordle game with server/client functionality and multiplayer support. It includes a normal Wordle game, server/client communication, and a multiplayer feature.

## Game Rules

### Rules in SinglePlay Mode
Player has to guess the word within a maximum number of rounds.

### Rules in Multiplayer Mode
Players enter the room by the roomId and provide a word for others to guess.
- **Win**: The only player who uses the least number of rounds to guess the word.
- **Tie**: Players who use the least number of rounds to guess the word.
- **Lose**: Otherwise.

## Dependencies
- Docker
- Node.js v22.8.0
- Npm 10.8.2

This project is developed and tested in `Ubuntu:20.04` environment.

To install the dependencies:
```bash
npm i
```

## Technologies Used
- **Node.js**: Server-side JavaScript runtime
- **TypeScript**: Typed superset of JavaScript for improved code quality
- **Redis**: In-memory data structure store
- **WebSocket**: Protocol for real-time communication
- **Jest**: Testing framework

## Setup and Execution

### Configuration

- Wordlist: `server/wordList.txt`
- Game configurations: `.env`
- Redis port and version configurations: `Makefile`

### Start the Database

```bash
make redis
```

### Start the Server
```bash
make server
```

### Start the Client
```bash
make client
```

### Testing
```bash
make redis server test
```

## Limitation and Trade-off
Currently, all WebSocket clients are stored in server.ts. This structure limits scalability for the multiplayer function. To improve, store all WebSocket client metadata in a common database (like Redis) to enable access across multiple server nodes.

Server and client are put in one repo using the same dependencies. The trade-offs are:
- **Simplified Management**:
Easier to manage and synchronize changes between server and client.
Single source of truth for the entire project.
- **Shared Resources**:
Common utilities or configurations can be easily shared between client and server.
- **Increased Complexity**
More chanllenging to manage if the project grows significantly.
- **Slower CI/CD**: 
Continuous Integration/Deployment processes may take longer due to the combined codebase.


## Justification for Using Redis and WebSocket

### Redis
Chosen for its speed and efficiency in handling real-time data.
Ideal for storing session data, game states, and managing real-time interactions in a scalable manner.

### WebSocket
Enables real-time, bidirectional communication between the server and clients.
Essential for providing a responsive gaming experience where players can receive immediate feedback on their actions.
This setup ensures a smooth and interactive multiplayer experience.