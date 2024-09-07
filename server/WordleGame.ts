import config from "./config";
import PlayerManager from './models/PlayerManager';
import { Room, RoomManager } from './models/RoomManager';
import Logger from './Logger';
import MessageType from "../common/MessageType";
import WebSocket from 'ws';
import { validateNumberOfPlayersInRoom, validateWord } from "./validate";
import RoomResult from "../common/RoomResult";


class WordleGame{
    private maxRounds: number;
    private wordList: string[];
    private lengthOfWords: number;
    private defaultAnswer: string
    private logger: Logger;
    private playerManager: PlayerManager;
    private roomManager: RoomManager;

    constructor() {
        this.maxRounds = config.maxRounds;
        this.wordList = config.words;
        this.lengthOfWords = config.lengthOfWords;
        this.defaultAnswer = this.wordList[Math.floor(Math.random() * this.wordList.length)];
        this.logger = new Logger("WordleGame");
        this.playerManager = new PlayerManager();
        this.roomManager = new RoomManager();

        this.logger.info(`Default Answer is ${this.defaultAnswer}`);
    }

    public async onNewConnection(ws: WebSocket): Promise<string> {
        const playerId = await this.playerManager.create();
        this.logger.info(`Sent welcome message to player ${playerId}`)
        ws.send(JSON.stringify({ type: MessageType.Welcome, playerId }));
        return playerId;
    }

    public async onCloseConnection(playerId: string): Promise<void> {
        await this.playerManager.delete(playerId)
    }

    public async handleCreateRoom(ws: WebSocket, playerId: string, word: string, numOfPlayers: number) {
        if (!validateNumberOfPlayersInRoom(numOfPlayers)) {
            ws.send(JSON.stringify({ type: MessageType.Error, message: `Not a valid numOfPlayers ${numOfPlayers}. Range: [2, ${config.maxPlayersInRoom}]`}));
            return
        }

        if (!validateWord(word)) {
            ws.send(JSON.stringify({ type: MessageType.Error, message: `Not a valid word ${word}`}));
            return
        }
        this.logger.info(`Create Room from player ${playerId}`);
        const roomId = await this.roomManager.create(numOfPlayers);
        await this.addPlayerToRoom(ws, roomId, playerId, word);
        ws.send(JSON.stringify({ type: MessageType.RoomCreated, message: `Room ${roomId} is created.`, roomId: roomId}));
    }
    
    public async handleJoinRoom(ws: WebSocket, roomId: string, playerId: string, word: string, wsClients: Map<string, WebSocket>) {
        if (!validateWord(word)) {
            ws.send(JSON.stringify({ type: MessageType.Error, message: `Not a valid word ${word}`}));
            return
        }
        this.logger.info(`Player ${playerId} has joined Room ${roomId}`);
        const roomIsReady = await this.addPlayerToRoom(ws, roomId, playerId, word);
        const playerIdsInRoom = await this.roomManager.getPlayerIdsInRoom(roomId);
        for (const playerIdInRoom of playerIdsInRoom) {
            let wsClient = wsClients.get(playerIdInRoom);
            if (wsClient != undefined) {
                wsClient.send(JSON.stringify({ type: MessageType.PlayerJoinedRoom, message: `Player ${playerId} joined room ${roomId}.`, playerId: playerId, roomId: roomId }));
            }
        }

        if (roomIsReady) {
            for (const playerId of playerIdsInRoom) {
                let wsClient = wsClients.get(playerId);
                if (wsClient != undefined) {
                    wsClient.send(JSON.stringify({ type: MessageType.Start, message: `Room ${roomId} is ready, start playing...`}));
                }
            }
        }
    }
    
    public async handlePlaySingle(ws: WebSocket, playerId: string) {
        this.logger.info(`Player ${playerId} play solo`);
        await this.playerManager.updateTargetWord(playerId, this.defaultAnswer);
        ws.send(JSON.stringify({ type: MessageType.Start, message: `Please enter a ${this.lengthOfWords}-letter word.` }));
    }

    public async handleGuess(ws: WebSocket, playerId: string, guess: string, wsClients: Map<string, WebSocket>): Promise<void> {
        this.logger.info(`Received guess '${guess}' from player ${playerId}`);
        if (!validateWord(guess)) {
            ws.send(JSON.stringify({ type: MessageType.Error, message: `Not a valid word ${guess}`}));
            return
        }
        
        const player = await this.playerManager.read(playerId)
        if (!player || player.hitTargetWord) return;
      
        guess = guess.toLowerCase();
           
        const currentRound = player.currentRound + 1;
        await this.playerManager.updateCurrentRound(playerId, currentRound);

        const feedback = this.getFeedback(guess, player.targetWord!);
        this.logger.info(`Sending feedback ${feedback} to player ${playerId}`);
        ws.send(JSON.stringify({ type: MessageType.Feedback, feedback }));
        
        if (player.roomId != undefined) {
            const playerIdsInRoom = await this.roomManager.getPlayerIdsInRoom(player.roomId);
            for (const playerIdInRoom of playerIdsInRoom) {
                if (playerIdInRoom === playerId) {
                    continue;
                }
                let wsClient = wsClients.get(playerIdInRoom);
                if (wsClient!= undefined) {
                    wsClient.send(JSON.stringify({ type: MessageType.ReportProgess, playerId: playerId, currentRound: currentRound }));
                }
            }
        }

        let hitTargetWord: boolean = false;
        let finishedGuessing: boolean = false;
        if (feedback === 'OOOOO') {
            await this.playerManager.updateHitTargetWord(playerId, true);
            hitTargetWord = true;
            finishedGuessing = true
            ws.send(JSON.stringify({ type: MessageType.Result, message: 'Congratulations! You\'ve guessed the word!' }));
        } else if (player.currentRound >= this.maxRounds) {
            ws.send(JSON.stringify({ type: MessageType.Result, message: `Game over! The correct word was: ${player.targetWord}` }));
            finishedGuessing = true
        }

        if (finishedGuessing && player.roomId) {
            const room = await this.roomManager.updatePlayerResult(player.roomId, playerId, hitTargetWord, currentRound);
            if (room && room.playerInRoomResultByPlayerId && Object.keys(room.playerInRoomResultByPlayerId).length == room.numOfPlayers) {
                const roomResults = this.determineRoomResults(room!);
                const playerIdsInRoom = await this.roomManager.getPlayerIdsInRoom(player.roomId);
                for (const playerIdInRoom of playerIdsInRoom) {
                    let wsClient = wsClients.get(playerIdInRoom);
                    if (wsClient!= undefined) {
                        const result = roomResults[playerIdInRoom];
                        wsClient.send(JSON.stringify({ type: MessageType.RoomResult, message: `Result of player ${playerId}: ${result}` }));
                    }
                }
            }
        }
      }
      
      
    private getFeedback(guess: string, answer: string): string {
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

    private async addPlayerToRoom(ws: WebSocket, roomId: string, playerId: string, word: string): Promise<boolean> {
        const room = await this.roomManager.addPlayer(roomId, playerId, word);
        if (!room) {
            ws.send(JSON.stringify({ type: MessageType.Error, message: `Failed to find room ${roomId}`}));
        } else if (room && room.roomIsReady) {
            return true
        }
        return false;
    }

    private determineRoomResults(room: Room): { [key: string]: RoomResult } {
        const results: { [key: string]: RoomResult } = {};
        const playerResults = room.playerInRoomResultByPlayerId;

        if (!playerResults) {
            return results;
        }

        let minRounds = Infinity;
        let winners: string[] = [];

        for (const playerId in playerResults) {
            const result = playerResults[playerId];
            if (result.hitTargetWord) {
                if (result.numOfRounds < minRounds) {
                    minRounds = result.numOfRounds;
                    winners = [playerId];
                } else if (result.numOfRounds === minRounds) {
                    winners.push(playerId);
                }
            }
        }

        for (const playerId in playerResults) {
            if (winners.includes(playerId) && winners.length === 1) {
                results[playerId] = RoomResult.WIN;
            } else if (winners.includes(playerId)) {
                results[playerId] = RoomResult.TIE;
            } else {
                results[playerId] = RoomResult.LOSE;
            }
        }

        return results;
    }

}

export default WordleGame;