const gameEventEmitter = require('../utils/eventEmitter');

let board = [['', '', ''], ['', '', ''], ['', '', '']];
let currentPlayer = 'X';

function printBoard() {
    board.forEach(row => console.log(row.join(' | ')));
    console.log('');
}

function makeMove(row, col) {
    if (board[row][col] === '') {
        board[row][col] = currentPlayer;
        gameEventEmitter.emit('moveMade', 'ticTacToe', { player: currentPlayer, row, col });
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        printBoard();
        if (checkGameOver()) return;
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
    } else {
        console.log('Invalid move, try again.');
    }
}

function checkGameOver() {
    const winPatterns = [
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]],
    ];
    for (const pattern of winPatterns) {
        const [a, b, c] = pattern;
        if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
            gameEventEmitter.emit('gameOver', 'ticTacToe', `${board[a[0]][a[1]]} wins!`);
            return true;
        }
    }

    if (board.flat().every(cell => cell)) {
        gameEventEmitter.emit('gameOver', 'ticTacToe', 'Draw');
        return true;
    }

    return false;
}

function start() {
    console.log('Tic Tac Toe has started!');
    board = [['', '', ''], ['', '', ''], ['', '', '']];
    printBoard();
}

module.exports = {
    start,
    makeMove,
};
