import WebSocket from 'ws';
import readline from 'readline';
import MessageType from '../common/MessageType';

const ws = new WebSocket('ws://localhost:3000');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class WordleClient{
  constructor() {};

  public handleWelcome(playerId: string) {
    console.log(`Welcome, your player ID is ${playerId}`);
    rl.question(`${MessageType.CreateRoom}, ${MessageType.JoinRoom} or ${MessageType.PlaySingle}?`, (answer: string) => {
      switch (answer) {
        case MessageType.CreateRoom:
          rl.question("Number of Players:", (numOfPlayers: string) => {
            rl.question("Provide a word:", (word: string) => {
              ws.send(JSON.stringify({ type: MessageType.CreateRoom, numOfPlayers: numOfPlayers, word: word}));
            })
          })
          break;
        case MessageType.JoinRoom:
          rl.question("Enter RoomId:", (roomId: string) => {
            rl.question("Provide a word:", (word: string) => {
              ws.send(JSON.stringify({ type: MessageType.JoinRoom, roomId: roomId, word: word}));
            })
          })
          break;
        case MessageType.PlaySingle:
          ws.send(JSON.stringify({ type: MessageType.PlaySingle, playerId: playerId}));
          break;
        default:
          console.error(`No suhc option: ${answer}`);
      }
    })
  }

  public submitGuess() {
    rl.question("Enter your guess: ", (guess: string) => {
      ws.send(JSON.stringify({ type: MessageType.Guess, guess: guess.trim() }));
    })
  }
}

const wordleClient = new WordleClient();

ws.on('open', () => {
  console.log('Connected to the server. Start guessing the 5-letter word.');
});

ws.on('message', (message: string) => {
  const data = JSON.parse(message);

  switch (data.type) {
    case MessageType.Welcome:
      wordleClient.handleWelcome(data.playerId);
      break;
    case MessageType.RoomCreated:
      console.log(`Room ${data.roomId} is created.`);
    case MessageType.playerJoinedRoom:
      const roomId = data.roomId;
      const playerId = data.playerId;
      console.log(`Player ${playerId} entered room ${roomId}.`);
      break;
    case MessageType.Start:
      console.log(`Start to play!`);
      wordleClient.submitGuess();
      break;
    case MessageType.Feedback:
      console.log(`Feedback: ${data.feedback}`);
      wordleClient.submitGuess();
      break;
    case MessageType.Result:
      console.log(data.message);
      ws.close()
      break;
    case MessageType.Error:
      console.log(`Error: ${data.message}`);
      break;
  }
});

ws.on('close', () => {
  console.log('Disconnected from the server.');
  rl.close();
  process.exit(0);
});