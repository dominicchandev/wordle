import config from './config';
import express from 'express';
import http from 'http';
import WebSocket, { Server } from 'ws';
import logWithTimestamp from './logger';

const app = express();
const server = http.createServer(app);
const wss = new Server({ server });

// Read from Configuration
const maxRounds: number = config.maxRounds; 
const wordList: string[] = config.words;
const answer: string = wordList[Math.floor(Math.random() * wordList.length)];

interface Player {
  currentRound: number;
  won: boolean;
}

let players: Record<string, Player> = {};

wss.on('connection', (ws: WebSocket) => {
  const playerId = Math.random().toString(36).substr(2, 9);
  players[playerId] = { currentRound: 0, won: false };

  ws.send(JSON.stringify({ type: 'welcome', playerId }));

  ws.on('message', (message: string) => {
    const data = JSON.parse(message);
    if (data.type === 'guess') {
      handleGuess(ws, playerId, data.guess);
    }
  });
  
  ws.on('close', () => {
    delete players[playerId];
  });
})

function handleGuess(ws: WebSocket, playerId: string, guess: string): void {
  logWithTimestamp(`Received guess '${guess}' from player ${playerId}`);
  if (!players[playerId] || players[playerId].won) return;

  const player = players[playerId];
  guess = guess.toLowerCase();

  if (guess.length !== 5) {
    ws.send(JSON.stringify({ type: 'error', message: 'Please enter a 5-letter word.' }));
    return;
  }

  player.currentRound++;
  const feedback = getFeedback(guess);
  logWithTimestamp(`Sending feedback ${feedback} to player ${playerId}`);
  ws.send(JSON.stringify({ type: 'feedback', feedback }));

  if (feedback === 'OOOOO') {
    player.won = true;
    ws.send(JSON.stringify({ type: 'result', message: 'Congratulations! You\'ve guessed the word!' }));
  } else if (player.currentRound >= maxRounds) {
    ws.send(JSON.stringify({ type: 'result', message: `Game over! The correct word was: ${answer}` }));
  }
}


function getFeedback(guess: string): string {
  let feedback: string = '';
  for (let i = 0; i < guess.length; i++) {
    if (guess[i] === answer[i]) {
      feedback += 'O'; // Hit
    } else if (answer.includes(guess[i])) {
      feedback += '?'; // Present
    } else {
      feedback += '_'; // Miss
    }
  }
  return feedback;
}

server.listen(config.server_port, () => {
  logWithTimestamp(`Wordle server is running on port ${config.server_port}`)
})