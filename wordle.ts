import * as readline from 'readline';
import config from './config';

console.log(config.words)

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Read from Configuration
const maxRounds: number = config.maxRounds; 
const wordList: string[] = config.words;
const answer: string = wordList[Math.floor(Math.random() * wordList.length)];

let currentRound: number = 0;

console.log("Welcome to Wordle! Guess the 5-letter word.");

function getFeedback(guess: string): string {
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

function playRound(): void {
  if (currentRound < maxRounds) {
    rl.question(`Round ${currentRound + 1}: Enter your guess: `, (guess: string) => {
      guess = guess.toLowerCase();

      if (guess.length !== 5) {
        console.log("Please enter a 5-letter word.");
        return playRound();
      }

      currentRound++;
      const feedback = getFeedback(guess);
      console.log(feedback.split('').join(' '));

      if (feedback === 'OOOOO') {
        console.log("Congratulations! You've guessed the word!");
        rl.close();
      } else if (currentRound < maxRounds) {
        playRound();
      } else {
        console.log(`Game over! The correct word was: ${answer}`);
        rl.close();
      }
    });
  }
}

playRound();