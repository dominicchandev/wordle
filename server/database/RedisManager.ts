import { createClient, RedisClientType } from 'redis';
import Logger from '../Logger';

class RedisManager {

    private static logger = new Logger("RedisManager");
    private static instance: RedisClientType;

    private constructor() {}

    public static async getClient(): Promise<RedisClientType> {
        if (!RedisManager.instance) {
        RedisManager.instance = createClient();
        RedisManager.instance.on('error', (err) => RedisManager.logger.error(`Redis Client Error ${err}`));
        await RedisManager.instance.connect();
        }
        return RedisManager.instance;
    }
}

export default RedisManager;