'use strict';

function playTicTacToe(socket, listGames) {
  let board = {
    1: '.',
    2: '.',
    3: '.',
    4: '.',
    5: '.',
    6: '.',
    7: '.',
    8: '.',
    9: '.',
  };

  const winCoordinates = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [3, 6, 9], [2, 5, 8], [1, 4, 7], [3, 5, 7], [1, 5, 9]];
  let playerOneTurn = true;
  // New line below: 19
  let isTwoPlayerMode = false;


  const game = {
    update: '',
    response: '',
    confirm: false,
    confirmation: null,
    eventCode: 'game-start',
  };

  const checkForWin = (playerChar) => {
    for (let i = 0; i < winCoordinates.length; i++) {
      if (winCoordinates[i].every(index => board[index] === playerChar)) {
        return true;
      }
    }
    return false;
  };

  const checkTie = () => {
    return Object.values(board).every(cell => cell !== '.');
  };

  const newGame = () => {
    board = {1: '.', 2: '.', 3: '.', 4: '.', 5: '.', 6: '.', 7: '.', 8: '.', 9: '.'};
  };

  const displayBoard = () => {
    return `\n${board[1]} | ${board[2]} | ${board[3]}\n${board[4]} | ${board[5]} | ${board[6]}\n${board[7]} | ${board[8]} | ${board[9]}\n`;
  };

  const gameStart = () => {
    // game.update = 'Starting a new game of Tic-Tac-Toe.\n' + displayBoard();
    game.update = 'Starting a new game of Tic-Tac-Toe.\nDo you want to play with a friend or against the computer?\n1. Friend\n2. Computer';
    // game.response = 'Player 1, choose a position (1-9):';
    game.response = 'Enter 1 or 2:';
    // game.eventCode = 'move';
    game.eventCode = 'choose-mode';
    socket.emit('game', game);
  };

  gameStart();

  // new code 64-68
  const makeAIMove = () => {
    let emptyPositions = Object.keys(board).filter(key => board[key] === '.');
    let aiMove = emptyPositions[Math.floor(Math.random() * emptyPositions.length)];
    board[aiMove] = 'O';
  };

  // new code 71-89
  socket.on('choose-mode', (choice) => {
    const num = parseInt(choice, 10);
    if (num === 1) {
      isTwoPlayerMode = true;
      game.update = 'Playing with a friend.\n' + displayBoard();
      game.response = 'Player 1, choose a position (1-9):';
      game.eventCode = 'move';
      socket.emit('game', game);
    } else if (num === 2) {
      isTwoPlayerMode = false;
      game.update = 'Playing against the computer.\n' + displayBoard();
      game.response = 'Player 1, choose a position (1-9):';
      game.eventCode = 'move';
      socket.emit('game', game);
    } else {
      game.update = 'Invalid choice. Please enter 1 or 2.\n' + game.update;
      socket.emit('game', game);
    }
  });

  socket.on('move', (msg) => {
    const position = parseInt(msg, 10);

    if (!Number.isInteger(position) || position < 1 || position > 9 || board[position] !== '.') {
      game.update = 'Invalid move! Try again.\n' + displayBoard();
      game.response = playerOneTurn ? 'Player 1, choose a position (1-9):' : 'Player 2, choose a position (1-9):';
      socket.emit('game', game);
      return;
    }

    board[position] = playerOneTurn ? 'X' : 'O';

    if (checkForWin(playerOneTurn ? 'X' : 'O')) {
      game.update = `Player ${playerOneTurn ? 1 : 2} wins!\n` + displayBoard();
      game.response = 'Would you like to play again? Y/N:';
      game.eventCode = 'game-restart';
      socket.emit('game', game);
      newGame();
      return;
    }

    if (checkTie()) {
      game.update = 'It\'s a TIE!!\n' + displayBoard();
      game.response = 'Would you like to play again? Y/N:';
      game.eventCode = 'game-restart';
      socket.emit('game', game);
      newGame();
      return;
    }

    playerOneTurn = !playerOneTurn;

    //   game.update = `Player ${playerOneTurn ? 1 : 2}'s turn.\n` + displayBoard();
    //   game.response = `Player ${playerOneTurn ? 1 : 2}, choose a position (1-9):`;
    //   game.eventCode = 'move';
    //   socket.emit('game', game);
    // });


    // new code 131 - 163
    if (isTwoPlayerMode) {
      game.update = `Player ${playerOneTurn ? 1 : 2}'s turn.\n` + displayBoard();
      game.response = `Player ${playerOneTurn ? 1 : 2}, choose a position (1-9):`;
      game.eventCode = 'move';
    } else {
      if (!playerOneTurn) {
        makeAIMove();
        if (checkForWin('O')) {
          game.update = `Computer wins!\n` + displayBoard();
          game.response = 'Would you like to play again? Y/N:';
          game.eventCode = 'game-restart';
          socket.emit('game', game);
          newGame();
          return;
        }

        if (checkTie()) {
          game.update = 'It\'s a TIE!!\n' + displayBoard();
          game.response = 'Would you like to play again? Y/N:';
          game.eventCode = 'game-restart';
          socket.emit('game', game);
          newGame();
          return;
        }

        playerOneTurn = true;
      }
      game.update = `Player 1's turn.\n` + displayBoard();
      game.response = `Player 1, choose a position (1-9):`;
      game.eventCode = 'move';
    }
    socket.emit('game', game);
  });

  socket.on('game-restart', (choice) => {
    const upperChoice = choice.toUpperCase();
    if (upperChoice === 'Y') {
      gameStart();
    } else if (upperChoice === 'N') {
      listGames();
    } else {
      game.update = 'Invalid response. ' + game.update;
      socket.emit('game', game);
    }
  });
}

module.exports = playTicTacToe;
