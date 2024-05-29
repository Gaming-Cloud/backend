'use strict';

const opponent = {
  makeMove(board, columns, rows, currentPlayer) {

    for (let col = 0; col < columns; col++) {
      const tempBoard = board.map(row => row.slice());
      if (this.dropDisc(tempBoard, col, currentPlayer) && this.checkWin(tempBoard, rows, columns, col, currentPlayer)) {
        return col;
      }
    }

    const opponentPlayer = currentPlayer === '🔵' ? '🟣' : '🔵';
    for (let col = 0; col < columns; col++) {
      const tempBoard = board.map(row => row.slice());
      if (this.dropDisc(tempBoard, col, opponentPlayer) && this.checkWin(tempBoard, rows, columns, col, opponentPlayer)) {
        return col;
      }
    }

    const validColumns = this.getValidColumns(board, columns);
    return validColumns[Math.floor(Math.random() * validColumns.length)];
  },

  dropDisc(board, column, player) {
    for (let row = board.length - 1; row >= 0; row--) {
      if (board[row][column] === null) {
        board[row][column] = player;
        return true;
      }
    }
    return false;
  },

  checkWin(board, rows, columns, column, player) {
    const row = board.findIndex(r => r[column] === player);
    return (
      this.checkDirection(board, row, column, 1, 0, player, rows, columns) ||
      this.checkDirection(board, row, column, 0, 1, player, rows, columns) ||
      this.checkDirection(board, row, column, 1, 1, player, rows, columns) ||
      this.checkDirection(board, row, column, 1, -1, player, rows, columns)
    );
  },

  checkDirection(board, row, column, rowDir, colDir, player, rows, columns) {
    let count = 1;
    for (let i = 1; i < 4; i++) {
      const newRow = row + rowDir * i;
      const newCol = column + colDir * i;
      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= columns || board[newRow][newCol] !== player) break;
      count++;
    }
    for (let i = 1; i < 4; i++) {
      const newRow = row - rowDir * i;
      const newCol = column - colDir * i;
      if (newRow < 0 || newRow >= rows || newCol < 0 || newCol >= columns || board[newRow][newCol] !== player) break;
      count++;
    }
    return count >= 4;
  },

  getValidColumns(board, columns) {
    return [...Array(columns).keys()].filter(col => board[0][col] === null);
  },
};

module.exports = opponent;
