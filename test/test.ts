import WebSocket from 'ws';
import MessageType from '../common/MessageType';
import * as dotenv from 'dotenv';

dotenv.config();

const maxRound = Number(process.env.MAX_ROUNDS);
const lengthOfWords = Number(process.env.LENGTH_OF_WORDS);
const testGuess = "a".repeat(lengthOfWords);
const invalidGuess = testGuess.repeat(2);
const serverPort = Number(process.env.SERVER_PORT)

describe('WebSocket Server', () => {
    let ws: WebSocket;
    let roomId: number;

    beforeAll((done) => {
        ws = new WebSocket(`ws://localhost:${serverPort}`);
        ws.on('open', done);
    });

    afterAll(() => {
        ws.close();
    });

    it('should connect and receive a welcome message', (done) => {
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());
            expect(data.type).toBe(MessageType.Welcome);
            done();
        }

    });

    it('should create a room', (done) => {
        let eventCount = 0;
        ws.onmessage = (event) => {
            eventCount++;
            const data = JSON.parse(event.data.toString());
            if (eventCount === 1) {
                roomId = data.roomId;
                expect(data.type).toBe(MessageType.RoomCreated);
                done();
            }
        };

        ws.send(JSON.stringify({
        type: MessageType.CreateRoom,
        word: testGuess,
        numOfPlayers: 2
        }));
    });

    it('should join a room', (done) => {
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());
            expect(data.type).toBe(MessageType.PlayerJoinedRoom);
            done();
        };

        ws.send(JSON.stringify({
        type: MessageType.JoinRoom,
        roomId: roomId,
        word: testGuess,
        }));
    });

    

    it('should reject roomId', (done) => {
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());
            expect(data.type).toBe(MessageType.Error);
            done();
        };

        ws.send(JSON.stringify({
        type: MessageType.JoinRoom,
        roomId: roomId + 1,
        word: testGuess,
        }));
    });

    it('should reject word', (done) => {
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());
            expect(data.type).toBe(MessageType.Error);
            done();
        };

        ws.send(JSON.stringify({
        type: MessageType.JoinRoom,
        roomId: roomId + 1,
        word: invalidGuess,
        }));
    });

    it('should start SinglePlay', (done) => {
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());
            expect(data.type).toBe(MessageType.Start);
            done();
        };

        ws.send(JSON.stringify({
        type: MessageType.PlaySingle,
        }));
    });
});

describe('Single Play Integration test', () => {
    let ws: WebSocket;
    let roomId: number;

    beforeAll((done) => {
        ws = new WebSocket(`ws://localhost:${serverPort}`);
        ws.on('open', done);
    });

    afterAll(() => {
        ws.close();
    });

    it('should connect and receive a welcome message', (done) => {
        ws.onmessage = (event) => {
            const data = JSON.parse(event.data.toString());
            expect(data.type).toBe(MessageType.Welcome);
            done();
        }

    });

    it('should start SinglePlay', (done) => {
        let eventCount = 0;
        ws.onmessage = (event) => {
            eventCount++;
            const data = JSON.parse(event.data.toString());
            if (eventCount === 1) {
                roomId = data.roomId;
                expect(data.type).toBe(MessageType.Start);
                done();
            }
        };

        ws.send(JSON.stringify({
        type: MessageType.PlaySingle,
        }));
    });

    for (let i=0; i < maxRound; i++) {
        test(`Submit guess ${i + 1}`, (done) => {
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data.toString());
                expect(data.type).toBe(MessageType.Feedback);
                done();
            };
    
            ws.send(JSON.stringify({
            type: MessageType.Guess,
            guess: testGuess,
            }));
        })
    }
    
    it('should receive result', (done) => {
        ws.onmessage = (event) => {
        const data = JSON.parse(event.data.toString());
        expect(data.type).toBe(MessageType.Result);
        done();
        }}
    )
});