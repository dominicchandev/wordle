import WebSocket from 'ws';
import readline from 'readline';

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('Connected to the server. Start guessing the 5-letter word.');
});

ws.on('message', (message: string) => {
  const data = JSON.parse(message);

  if (data.type === 'welcome') {
    console.log(`Welcome, your player ID is ${data.playerId}`);
  } else if (data.type === 'feedback') {
    console.log(`Feedback: ${data.feedback}`);
  } else if (data.type === 'result') {
    console.log(data.message);
    ws.close();
  } else if (data.type === 'error') {
    console.log(`Error: ${data.message}`);
  }
});

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.on('line', (input: string) => {
  ws.send(JSON.stringify({ type: 'guess', guess: input.trim() }));
});