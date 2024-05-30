'use strict';

const games = {};
let gameState;
let gameID;
let user;
let opponent;
const Chance = require('chance');
const chance = new Chance();

function playBattleship(socket, listGames) {
  const game = {
    update: '',
    response: '',
    confirm: false,
    eventCode: 'game-start',
  };
  const lastGame = {
    player1: game,
    player2: game,
  }

  const invalidResponse = (specSocket, player = 'player1') => {
    game.update = 'I\'m sorry, but your response wasn\'t a valid option. Please try again.\n' + lastGame[player];
    specSocket.emit('game', game);
  };

  const gameStart = () => {
    game.update = null;
    game.response = 'Would you like to create a new game or join someone else\'s? Enter "C" for create or "J" for join: ';
    game.eventCode = 'game-start';
    lastGame.player1 = game;
    socket.emit('game', game);
  }

  gameStart();

  socket.on('game-start', (choice) => {
    const upperChoice = choice.toUpperCase();
    if (upperChoice === 'C') {
      const newGame = require('./data.json');
      gameID = chance.guid();
      games[gameID] = newGame;
      gameState = games[gameID];
      user = 'player1';
      opponent = 'player2';
      gameState[user].socket = socket;

      game.update = 'New game created';
      game.response = 'Would you like an AI to play against? Y/N: ';
      game.confirm = true;
      game.eventCode = 'opponent-choice';
      lastGame[user] = game;
      socket.emit('game', game);
    } else if (upperChoice === 'J') {
      game.update = null;
      game.response = 'Enter your friend\'s joinable ID, or enter "BACK" to return to the previous menu: ';
      game.confirm = true;
      game.eventCode = 'game-id';
      lastGame[user] = game;
      socket.emit('game', game);
    } else {
      invalidResponse(socket);
    }
  });

  socket.on('opponent-choice', (choice) => {
    const upperChoice = choice.toUpperCase();
    if (upperChoice === 'Y') {
      gameState.AI = true;

      game.update = null;
      game.response = ''
      game.confirm = false;

      placeShips(user);

    } else if (upperChoice === 'N') {
      gameState.AI = false;

      game.update = `Your joinable ID is: ${gameID}\nCopy this and send it to your friend so they can join you!\nWaiting for opponent...`;
      game.response = null;
      lastGame[user] = game;
      socket.emit('game', game);
    } else {
      invalidResponse(socket);
    }
  });

  socket.on('game-id', (ID) => {
    const upperID = ID.toUpperCase();
    if (upperID === 'BACK') {
      gameStart();
    } else if (games[ID]) {
      gameState = games[ID];
      gameID = ID;
      user = 'player2';
      opponent = 'player1';
      gameState[user].socket = socket;

      game.update = 'Your friend has joined';
      game.response = null;
      game.confirm = null;
      lastGame[opponent] = game;
      gameState[opponent].socket.emit('game', game);

      game.update = 'Joined successfully';
      lastGame[user] = game;
      gameState[user].socket.emit('game', game);

      setTimeout(() => {
        placeShips(opponent);
        placeShips(user);
      }, 3000)
    } else {
      invalidResponse(socket);
    }
  });

  function displayBoard(player) {
    const boardData = gameState[player].board;
    const boardTop = '|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|\n|         |         |         |         |         |         |         |         |         |         |         |';
    const vertSeperator = '\n|         |         |         |         |         |         |         |         |         |         |         |\n|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|\n|         |         |         |         |         |         |         |         |         |         |         |';
    const makeDataRow = (letter, dataArray) => {
      let str = `\n|    ${letter}    |`;
      for (let i = 0; i < 10; i++) {
        str += `    ${dataArray[i]}    |`;
      }
      return str;
    }
    let boardDisplay = boardTop;
    boardDisplay += makeDataRow(' ', "1234567890");
    for (let i = 0; i < 10; i++) {
      const letter = String.fromCharCode('A'.charCodeAt(0) + i);
      boardDisplay += vertSeperator;
      boardDisplay += makeDataRow(letter, boardData[i]);
    }
    boardDisplay += '\n|         |         |         |         |         |         |         |         |         |         |         |\n|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|---------|';
    return boardDisplay;
  }                     

  function placeShips(player) {
    const ships = Object.keys(require('./data.json')[player].ships);
    const lengths = '54332'; // Lengths of the ships in the same order as the keys in 'ships'
    let ship = 0;
    let startSquare;
  
    function askShipSquare(update = null) {
      game.update = update;
      game.response = `Choose a starting square for your ${ships[ship]}: `;
      game.eventCode = 'ship-square';
      lastGame[player] = game;
      gameState[player].socket.emit('game', game);
    }
  
    askShipSquare();
  
    gameState[player].socket.on('ship-square', (square) => {
      const upperSquare = square.toUpperCase();
      if (/^[A-J]([1-9]|10)$/.test(upperSquare)) {
        startSquare = {
          x: parseInt(upperSquare.slice(1), 10) - 1,
          y: upperSquare.charCodeAt(0) - 'A'.charCodeAt(0),
        };
  
        game.update = `${displayBoard(player)}\nYour ship's starting square is ${upperSquare}`;
        game.response = 'What direction should your ship face? Enter "N" for North, etc.: ';
        game.eventCode = 'ship-direction';
        lastGame[player] = game;
        gameState[player].socket.emit('game', game);
      } else {
        invalidResponse(gameState[player].socket);
      }
    });
  
    gameState[player].socket.on('ship-direction', (direction) => {
      const upperDirection = direction.toUpperCase();
      if (/^[NSEW]$/.test(upperDirection)) {
        const directions = {
          N: { dx: 0, dy: -1 },
          S: { dx: 0, dy: 1 },
          E: { dx: 1, dy: 0 },
          W: { dx: -1, dy: 0 },
        };
  
        const { dx, dy } = directions[upperDirection];
        const shipLength = Number(lengths[ship]);
        let validPlacement = true;
  
        for (let i = 0; i < shipLength; i++) {
          const newX = startSquare.x + dx * i;
          const newY = startSquare.y + dy * i;
  
          if (newX < 0 || newX >= 10 || newY < 0 || newY >= 10 || gameState[player].board[newY][newX] === 'X') {
            validPlacement = false;
            break;
          }
        }
  
        if (validPlacement) {
          for (let i = 0; i < shipLength; i++) {
            const newX = startSquare.x + dx * i;
            const newY = startSquare.y + dy * i;
            gameState[player].ships[ships[ship]].push({ x: newX, y: newY });
            gameState[player].board[newY][newX] = 'X';
          }
  
          ship++;
          if (ship < ships.length) {
            askShipSquare(displayBoard(player));
          } else if (gameState.AI) {
            game.update = displayBoard(player) + '\n';
          } else if (gameState[opponent].ships.destroyer.length) {
            // All ships placed, ready for game start
          } else {
            game.update = displayBoard(player) + '\nWaiting for opponent...';
            game.response = null;
            lastGame[player] = game;
            gameState[player].socket.emit('game', game);
          }
        } else {
          invalidResponse(gameState[player].socket);
        }
      } else {
        invalidResponse(gameState[player].socket);
      }
    });
  }
}

module.exports = playBattleship;