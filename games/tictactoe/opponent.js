'use strict';

const gameEventEmitter = require('../../utils/eventEmitter');

function getRandomInt(max) {
  return Math.floor(Math.random() * max);
}

function makeOpponentMove(socket, board) {
  let row, col;
  do {
    row = getRandomInt(3);
    col = getRandomInt(3);
  } while (board[row][col] !== '');

  socket.emit('makeMove', { row, col });
}

function startOpponent(io) {
  io.on('connection', (socket) => {
    gameEventEmitter.on('moveMade', (gameName, move) => {
      if (gameName === 'ticTacToe') {
        makeOpponentMove(socket, move.board);
      }
    });
  });
}

module.exports = {
  startOpponent,
};
