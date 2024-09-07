import RedisManager from "../database/RedisManager";
import Logger from "../Logger";
import RoomResult from "../../common/RoomResult";
interface Player {
    currentRound: number;
    hitTargetWord: boolean;
    targetWord?: string;
    roomId?: string;
    providedWord?: string;
    roomResult?: RoomResult;
}

class PlayerManager {
    private largestIdKey: string;
    private logger: Logger;

    constructor() {
        this.largestIdKey = "largestPlayerId";
        this.logger = new Logger("PlayerManager");
    }

    public async read(playerId: string): Promise<Player | null> {
        const redisClient = await RedisManager.getClient();
        const player_data = await redisClient.get(`player:${playerId}`);
        return player_data ? JSON.parse(player_data) : null;
    }

    public async create(): Promise<string> {
        const redisClient = await RedisManager.getClient();
        const playerId = await redisClient.incr(this.largestIdKey);
        let player: Player = { currentRound: 0, hitTargetWord: false };
        await redisClient.set(`player:${playerId}`, JSON.stringify(player));
        this.logger.info(`Created player: ${playerId}`);
        return playerId.toString();
    }

    public async delete(playerId: string): Promise<void> {
        const player = await this.read(playerId);
        if (player) {
            const redisClient = await RedisManager.getClient();
            await redisClient.del(`player:${playerId}`);
            this.logger.info(`Deleted player ${playerId}`);
        }   
    }

    public async updateRoomId(playerId: string, roomId: string) {
        const player_in_redis = await this.read(playerId);
        if (player_in_redis) {
            const redisClient = await RedisManager.getClient();
            player_in_redis.roomId = roomId;
            await redisClient.set(`player:${playerId}`, JSON.stringify(player_in_redis));
            this.logger.info(`Update player ${playerId} to ${JSON.stringify(player_in_redis)}`);
        }
    } 

    public async updateTargetWord(playerId: string, targetWord: string) {
        const player_in_redis = await this.read(playerId);
        if (player_in_redis) {
            const redisClient = await RedisManager.getClient();
            player_in_redis.targetWord = targetWord;
            await redisClient.set(`player:${playerId}`, JSON.stringify(player_in_redis));
            this.logger.info(`Update player ${playerId} to ${JSON.stringify(player_in_redis)}`);
        }
    }

    public async updateProvidedWord(playerId: string, providedWord: string) {
        const player_in_redis = await this.read(playerId);
        if (player_in_redis) {
            const redisClient = await RedisManager.getClient();
            player_in_redis.providedWord = providedWord;
            await redisClient.set(`player:${playerId}`, JSON.stringify(player_in_redis));
            this.logger.info(`Update player ${playerId} to ${JSON.stringify(player_in_redis)}`);
        }
    }

    public async updateCurrentRound(playerId: string, currentRound: number) {
        const player = await this.read(playerId);
        if (player) {
            const redisClient = await RedisManager.getClient();
            player.currentRound = currentRound;
            await redisClient.set(`player:${playerId}`, JSON.stringify(player));
            this.logger.info(`Update player ${playerId} to ${JSON.stringify(player)}`);
        }
    }

    public async updateRoomResult(playerId: string, roomResult: RoomResult) {
        const player = await this.read(playerId);
        if (player) {
            const redisClient = await RedisManager.getClient();
            player.roomResult = roomResult;
            await redisClient.set(`player:${playerId}`, JSON.stringify(player));
            this.logger.info(`Update player ${playerId} to ${JSON.stringify(player)}`);
        }
    }

    public async updateHitTargetWord(playerId: string, hitTargetWord: boolean) {
        const player = await this.read(playerId);
        if (player) {
            const redisClient = await RedisManager.getClient();
            player.hitTargetWord = hitTargetWord;
            await redisClient.set(`player:${playerId}`, JSON.stringify(player));
            this.logger.info(`Update player ${playerId} to ${JSON.stringify(player)}`);
        }
    }
}

export default PlayerManager;