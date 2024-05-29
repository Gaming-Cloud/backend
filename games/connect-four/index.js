'use strict';

function playConnectFour(socket, listGames) {
  const rows = 6;
  const columns = 7;
  let board = Array.from({ length: rows }, () => Array(columns).fill(null));
  let currentPlayer = '🔵';
  let gameActive = true;

  socket.emit('game', { update: renderBoard(), response: 'Enter a column (0-6) to drop your disc: ', eventCode: 'make-move' });

  socket.on('make-move', (column) => {
    if (!gameActive) return;

    column = parseInt(column, 10);
    if (Number.isNaN(column) || column < 0 || column >= columns) {
      socket.emit('game', { update: renderBoard(), response: 'Invalid column. Enter a column (0-6): ', eventCode: 'make-move' });
      return;
    }

    const row = dropDisc(column);
    if (row === -1) {
      socket.emit('game', { update: renderBoard(), response: 'Column is full. Enter a different column (0-6): ', eventCode: 'make-move' });
      return;
    }

    if (checkWin(row, column)) {
      gameActive = false;
      socket.emit('game', { update: renderBoard(), response: `Player ${currentPlayer} wins!`, eventCode: null });
      return;
    }

    if (board.flat().every(cell => cell !== null)) {
      gameActive = false;
      socket.emit('game', { update: renderBoard(), response: 'The game is a draw!', eventCode: null });
      return;
    }

    currentPlayer = currentPlayer === '🔵' ? '🟣' : '🔵';
    socket.emit('game', { update: renderBoard(), response: `Player ${currentPlayer}'s turn. Enter a column (0-6): `, eventCode: 'make-move' });
  });

  function dropDisc(column) {
    for (let row = rows - 1; row >= 0; row--) {
      if (board[row][column] === null) {
        board[row][column] = currentPlayer;
        return row;
      }
    }
    return -1;
  }

  function checkWin(row, column) {
    return (
      checkDirection(row, column, 1, 0) ||
      checkDirection(row, column, 0, 1) ||
      checkDirection(row, column, 1, 1) ||
      checkDirection(row, column, 1, -1)
    );
  }

  function checkDirection(row, column, rowDir, colDir) {
    let count = 1;
    for (let i = 1; i < 4; i++) {
      const newRow = row + rowDir * i;
      const newCol = column + colDir * i;
      if (
        newRow < 0 ||
        newRow >= rows ||
        newCol < 0 ||
        newCol >= columns ||
        board[newRow][newCol] !== currentPlayer
      )
        break;
      count++;
    }
    for (let i = 1; i < 4; i++) {
      const newRow = row - rowDir * i;
      const newCol = column - colDir * i;
      if (
        newRow < 0 ||
        newRow >= rows ||
        newCol < 0 ||
        newCol >= columns ||
        board[newRow][newCol] !== currentPlayer
      )
        break;
      count++;
    }
    return count >= 4;
  }

  function renderBoard() {
    let renderedBoard = '';
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < columns; col++) {
        if (board[row][col] === null) {
          renderedBoard += '⚪️'; // Empty space
        } else {
          renderedBoard += board[row][col];
        }
        renderedBoard += ' ';
      }
      renderedBoard += '\n';
    }
    return renderedBoard;
  }
}

module.exports = playConnectFour;
