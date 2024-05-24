'use strict';

const readline = require('readline');
const express = require('express');
const gameEventEmitter = require('./utils/eventEmitter');
const ticTacToe = require('./games/tictactoe');
const hangman = require('./games/hangman');


const app = express();
const port = process.env.PORT || 3000;

const games = {
    ticTacToe,
    hangman,
};

let currentGame = null;

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function promptUser(question) {
    return new Promise(resolve => rl.question(question, resolve));
}


async function startGame(gameName) {
    if (games[gameName]) {
        console.log(`Starting ${gameName}...`);
        currentGame = gameName;
        games[gameName].start();
        await gameLoop(gameName);
    } else {
        console.log(`Game ${gameName} not found!`);
        rl.close();
    }
}

async function gameLoop(gameName) {
    while (true) {
        if (gameName === 'ticTacToe') {
            const move = await promptUser('Enter your move (row,col): ');
            const [row, col] = move.split(',').map(Number);
            if (row != null && col != null) {
                ticTacToe.makeMove(row, col);
            } else {
                console.log('Invalid input. Please enter row,col.');
            }
        } else if (gameName === 'hangman') {
            const letter = await promptUser('Enter a letter: ');
            hangman.makeGuess(letter);
        }
    }
}

// Example of starting a game
startGame('ticTacToe');
// startGame('hangman');

// Listen for events
gameEventEmitter.on('gameOver', (gameName, result) => {
    console.log(`Game ${gameName} is over. Result: ${result}`);
    rl.close();
});

gameEventEmitter.on('moveMade', (gameName, move) => {
    console.log(`Move made in ${gameName}: ${move}`);
});

app.listen(port, () =>
    (`Server is running on http://localhost:${port}`)
  );
// Additional event listeners can be added here


