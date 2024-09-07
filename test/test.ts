import WebSocket from 'ws';
import MessageType from '../common/MessageType';

describe('WebSocket Server', () => {
    let ws: WebSocket;
    let roomId: number;

    beforeAll((done) => {
        ws = new WebSocket('ws://localhost:3000');
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
        word: 'hello',
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
        word: 'world',
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
        word: 'apple',
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
        word: 'apple00000000000',
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