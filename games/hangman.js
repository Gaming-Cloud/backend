const gameEventEmitter = require('../utils/eventEmitter');

let word = 'example';
let guessedLetters = [];
let attemptsLeft = 6;

function printWord() {
    let display = word.split('').map(letter => (guessedLetters.includes(letter) ? letter : '_')).join(' ');
    console.log(display);
    console.log(`Attempts left: ${attemptsLeft}`);
}

function makeGuess(letter) {
    if (!guessedLetters.includes(letter)) {
        guessedLetters.push(letter);
        if (!word.includes(letter)) {
            attemptsLeft--;
        }
        gameEventEmitter.emit('moveMade', 'hangman', { letter, attemptsLeft });
        printWord();
        checkGameOver();
    } else {
        console.log('You already guessed that letter.');
    }
}

function checkGameOver() {
    if (attemptsLeft <= 0) {
        gameEventEmitter.emit('gameOver', 'hangman', 'lose');
        return true;
    }
    if (word.split('').every(letter => guessedLetters.includes(letter))) {
        gameEventEmitter.emit('gameOver', 'hangman', 'win');
        return true;
    }
    return false;
}

function start() {
    console.log('Hangman has started!');
    word = 'example'; // Reset or choose a new word
    guessedLetters = [];
    attemptsLeft = 6;
    printWord();
}

module.exports = {
    start,
    makeGuess,
};
