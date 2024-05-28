'use strict';

function ticTacToe(socket, Listgames) {
  const board = {
    1: '.', 2: '.', 3: '.',
    4: '.', 5: '.', 6: '.',
    7: '.', 8: '.', 9: '.',
  };
  const winCoordinates = [
    [1, 2, 3], [4, 5, 6], [7, 8, 9],
    [1, 4, 7], [2, 5, 8], [3, 6, 9],
    [1, 5, 9], [3, 5, 7],
  ];

  let playerOneTurn = true;

  function checkForWin(playerChar) {
    return winCoordinates.some(combo =>
      combo.every(index => board[index] === playerChar),
    );
  }

  function checkTie() {
    return Object.values(board).every(cell => cell !== '.');
  }

  function newGame() {
    Object.keys(board).forEach(key => board[key] = '.');
  }

  socket.on('move', msg => {
    const player = playerOneTurn ? 'x' : 'o';
    if (board[msg] !== '.') {
      socket.emit('game', { update: 'Spot already taken', eventCode: 'turn' })
    } else {
      board[msg] = player;
      if (checkForWin(player)) {
        socket.emit('game', { update: `Player ${playerOneTurn ? '1' : '2'} won`, eventCode: 'win' });
        newGame();
      } else if (checkTie()) {
        socket.emit('game', { update: 'It\'s a TIE!!', eventCode: 'win' });
        newGame();
      } else {
        playerOneTurn = !playerOneTurn;
        socket.emit('game', { update: 'Board updated', board, eventCode: 'board' });
        socket.emit('game', { update: '', response: 'Your move (1-9): ', eventCode: 'turn' });
      }
    }
  });

  socket.on('exit', () => {
    socket.emit('game', { update: `Game won by ${playerOneTurn ? 'second' : 'first'} player`, eventCode: 'win' });
    newGame();
    Listgames();
  });

  socket.emit('game', { update: 'Board updated', board, eventCode: 'board' });
}

module.exports = ticTacToe;
