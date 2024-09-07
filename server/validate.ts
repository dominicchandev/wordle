import config from "./config";

export function validateWord(word: string): boolean {
    return word.length == config.lengthOfWords;
}

export function validateNumberOfPlayersInRoom(numOfPlayers: number): boolean {
    return 2 <= numOfPlayers && numOfPlayers <= config.maxPlayersInRoom;
}


