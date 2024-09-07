import WebSocket from 'ws';
import readline from 'readline';
import MessageType from '../common/MessageType';
import * as dotenv from 'dotenv';

dotenv.config();

const ws = new WebSocket(`ws://localhost:${process.env.SERVER_PORT}`);
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class WordleClient{
  public joinedRoom: boolean;
  public askLastQuestion: () => void;

  constructor() {
    this.joinedRoom = false;
    this.askLastQuestion = () => {};
  };

  private validateWordInput(input: string): boolean {
    return input.length === Number(process.env.LENGTH_OF_WORDS);
  }

  private validateNumberOfPlayers(input: string): boolean {
    const numOfPlayers = Number(input);
    return (!isNaN(numOfPlayers) && 2 <= numOfPlayers && numOfPlayers <= Number(process.env.MAX_PLAYERS_IN_ROOM));
  }

  private askQuestion(question: string, validator: (input: string) => boolean) {
    return new Promise<string>((resolve) => {
      function ask() {
        rl.question(question, (answer) => {
          if (validator(answer)) {
            resolve(answer);
          } else {
            console.log('Invalid input. Please try again.');
            ask();
          }
        });
      }
      ask();
    });
  }

  public handleWelcome(playerId: string) {
    console.log(`Welcome, your player ID is ${playerId}`);

    this.askQuestion(`${MessageType.CreateRoom}, ${MessageType.JoinRoom} or ${MessageType.PlaySingle}?`, (input) => [MessageType.CreateRoom, MessageType.JoinRoom, MessageType.PlaySingle].includes(input as MessageType) )
    .then((playMode) => {
      switch (playMode) {
        case MessageType.CreateRoom:
          this.askLastQuestion = () => {
            this.askQuestion("Number of Players: ", this.validateNumberOfPlayers)
            .then((numOfPlayers) => {
              this.askQuestion("Provide a word: ", this.validateWordInput)
              .then((word) => {
                ws.send(JSON.stringify({ type: MessageType.CreateRoom, numOfPlayers: numOfPlayers, word: word}));
              })
            })
          }
          this.askLastQuestion();
          break;
        case MessageType.JoinRoom:
          this.askLastQuestion = () => {
            this.askQuestion("Enter RoomId: ", (input) => !isNaN(Number(input)))
            .then((roomId) => {
              this.askQuestion("Provide a word: ", this.validateWordInput)
              .then((word) => {
                ws.send(JSON.stringify({ type: MessageType.JoinRoom, roomId: roomId, word: word}));
              })
            })
          }
          this.askLastQuestion();
          break;
        case MessageType.PlaySingle:
          ws.send(JSON.stringify({ type: MessageType.PlaySingle, playerId: playerId}));
          break;
      }
    })
  }

  public submitGuess() {
    this.askQuestion("Enter your guess: ", this.validateWordInput)
    .then((guess) => {
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
    case MessageType.PlayerJoinedRoom:
      const roomId = data.roomId;
      const playerId = data.playerId;
      wordleClient.joinedRoom = true;
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
    case MessageType.ReportProgess:
      if (wordleClient.joinedRoom) {
        console.log(`Player ${data.playerId} is in ${data.currentRound} round.`);
      }
      break;
    case MessageType.Result:
      console.log(data.message);
      if (!wordleClient.joinedRoom) {
        ws.close();
      }
      break;
    case MessageType.RoomResult:
      console.log(data.message);
      if (wordleClient.joinedRoom) {
        ws.close();
      }
      break;
    case MessageType.Error:
      console.log(`Error: ${data.message}`);
      wordleClient.askLastQuestion();
      break;
  }
});

ws.on('close', () => {
  console.log('Disconnected from the server.');
  rl.close();
  process.exit(0);
});