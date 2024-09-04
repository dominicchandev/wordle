import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

dotenv.config()

interface Config {
    words: string[]
    lengthOfWords: number
    maxRounds: number
}

const lengthOfWords = Number(process.env.LENGTH_OF_WORDS) || 0;

function loadWords(filePath: string): string[] {
    try {
        const fullPath = path.resolve(__dirname, filePath);
        const data = fs.readFileSync(fullPath, 'utf-8');
        
        return data.split('\n').map(word => word.trim().toLowerCase()).filter(word => word.length === lengthOfWords);
    } catch (error) {
        console.error('Error reading word list:', error);
        return [];
    }
}

const words = loadWords(process.env.WORD_LIST_PATH || '');

const config: Config = {
    words: words,
    maxRounds: Number(process.env.MAX_ROUND || 5),
    lengthOfWords: lengthOfWords,
}

export default config;