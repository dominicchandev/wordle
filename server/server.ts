import config from './config';
import express from 'express';
import http from 'http';
import WebSocket, { Server } from 'ws';
import Logger from './Logger';
import MessageType from '../common/MessageType';
import WordleGame from './WordleGame';

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

const logger = new Logger("wordle-server");

const wordleGame = new WordleGame();
const wsClients = new Map<string, WebSocket>();

wss.on('connection', async (ws: WebSocket) => {
  const playerId = await wordleGame.onNewConnection(ws);
  wsClients.set(playerId, ws)

  ws.on('message', async (message: string) => {
    const data = JSON.parse(message);

    switch (data.type) {
      case MessageType.CreateRoom:
        await wordleGame.handleCreateRoom(ws, playerId, data.word, data.numOfPlayers);
        break;
      case MessageType.JoinRoom:
        await wordleGame.handleJoinRoom(ws, data.roomId, playerId, data.word, wsClients);
        break;
      case MessageType.PlaySingle:
        await wordleGame.handlePlaySingle(ws, playerId);
        break;
      case MessageType.Guess:
        await wordleGame.handleGuess(ws, playerId, data.guess, wsClients);
        break;
      default:
        logger.error("Unknown message type");
    }
  });
  
  ws.on('close', async () => {
    wsClients.delete(playerId);
    await wordleGame.onCloseConnection(playerId);
  });
})

server.listen(config.server_port, () => {
  logger.info(`Wordle server is running on port ${config.server_port}`)
})