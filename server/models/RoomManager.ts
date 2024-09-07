import RedisManager from "../database/RedisManager";
import Logger from "../Logger";
import PlayerManager from "./PlayerManager";


interface PlayerInRoomResult {
    hitTargetWord: boolean;
    numOfRounds: number;
}

export interface Room {
    roomIsReady: boolean;
    numOfPlayers: number;
    wordsByPlayerId?: {[key: string]: string};
    playerInRoomResultByPlayerId?: {[key: string]: PlayerInRoomResult};
}

export class RoomManager {
    private largestIdKey: string;
    private logger: Logger;
    private playerManager: PlayerManager

    constructor() {
        this.largestIdKey = "largestRoomId";
        this.logger = new Logger("RoomManager");
        this.playerManager = new PlayerManager();
    }

    public async read(roomId: string): Promise<Room | null> {
        const redisClient = await RedisManager.getClient();
        const room_data = await redisClient.get(`room:${roomId}`);
        return room_data ? JSON.parse(room_data) : null;
    }

    public async getPlayerIdsInRoom(roomId: string): Promise<string[]> {
        const room = await this.read(roomId);
        if (room && room.wordsByPlayerId != undefined) {
            return Object.keys(room.wordsByPlayerId);
        }
        return [];
    }

    public async create(numOfPlayers: number): Promise<string> {
        const redisClient = await RedisManager.getClient();
        const roomId = await redisClient.incr(this.largestIdKey);
        const room: Room = { roomIsReady: false, numOfPlayers: numOfPlayers };
        await redisClient.set(`room:${roomId}`, JSON.stringify(room));
        this.logger.info(`Created room: ${roomId}`);
        return roomId.toString();
    }

    public async delete(roomId: string): Promise<void> {
        const player = await this.read(roomId);
        if (player) {
            const redisClient = await RedisManager.getClient();
            await redisClient.del(`room:${roomId}`);
            this.logger.info(`Deleted room ${roomId}`);
        }   
    }

    public async addPlayer(roomId: string, playerId: string, word: string): Promise<Room | null> {
        const room = await this.read(roomId);
        this.logger.info(`reading room: ${JSON.stringify(room)}`);
        const player = await this.playerManager.read(playerId);
        if (!room || !player) {
            return null
        }
        
        const redisClient = await RedisManager.getClient();
        if (room.wordsByPlayerId === undefined) {
            room.wordsByPlayerId = {};
        }
        await this.playerManager.updateRoomId(playerId, roomId);
        await this.playerManager.updateProvidedWord(playerId, word);
        this.logger.info(`Before setting wordsByPlayerId: ${JSON.stringify(room.wordsByPlayerId)}`)
        room.wordsByPlayerId[playerId] = word;
        this.logger.info(`After setting wordsByPlayerId: ${JSON.stringify(room.wordsByPlayerId)}`)
        

        const playerIds = Object.keys(room.wordsByPlayerId);
        if (playerIds.length == room.numOfPlayers) {
            this.logger.info(`Room ${roomId} is full, assigning target words to player`)
            room.roomIsReady = true;
            const playerIds = Object.keys(room.wordsByPlayerId);
            const words = Object.values(room.wordsByPlayerId);

            for (let i=0; i < playerIds.length; i++) {
                let nextIndex = (i + 1) % playerIds.length;
                let currentPlayerId = playerIds[i];
                let nextWord = words[nextIndex];
                await this.playerManager.updateTargetWord(currentPlayerId, nextWord);
            }
        }
        this.logger.info(`updated room to ${JSON.stringify(room)}`);
        await redisClient.set(`room:${roomId}`, JSON.stringify(room));
        return room
    }

    public async updatePlayerResult(roomId: string, playerId: string, hitTargetWord: boolean, numOfRounds: number): Promise<Room | null> {
        const room = await this.read(roomId);
        const player = await this.playerManager.read(playerId);
        if (!room || !player) {
            return null
        }

        const playerInRoomResult: PlayerInRoomResult =  { hitTargetWord: hitTargetWord, numOfRounds: numOfRounds };
        if (room.playerInRoomResultByPlayerId === undefined) {
            room.playerInRoomResultByPlayerId = {};
        }
        room.playerInRoomResultByPlayerId[playerId] = playerInRoomResult;

        const redisClient = await RedisManager.getClient();
        await redisClient.set(`room:${roomId}`, JSON.stringify(room));
        return room
    }
}