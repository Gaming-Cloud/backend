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
  };

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
  };

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
      game.response = '';
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
      }, 3000);
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
    };
    let boardDisplay = boardTop;
    boardDisplay += makeDataRow(' ', "1234567890".split(''));
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
            gameState[player].ships[ships[ship]].push({ x: newX, y: newY, hit: false });
            gameState[player].board[newY][newX] = 'X';
          }

          ship++;
          if (ship < ships.length) {
            askShipSquare(displayBoard(player));
          } else {
            // Check if both players have placed their ships
            if (gameState[player].ships.destroyer.length > 0) {
              if (gameState[opponent].ships.destroyer.length > 0) {
                // Both players have placed their ships, start the game
                for (let i = 0; i < 10; i++) {
                  for (let j = 0; j < 10; j++) {
                    gameState[user].board[i][j] = ' ';
                    gameState[opponent].board[i][j] = ' ';
                  }
                }
                startGuessing();
              } else {
                game.update = displayBoard(player) + '\nWaiting for opponent...';
                game.response = null;
                lastGame[player] = game;
                gameState[player].socket.emit('game', game);
              }
            }
          }
        } else {
          invalidResponse(gameState[player].socket);
        }
      } else {
        invalidResponse(gameState[player].socket);
      }
    });
  }

  function startGuessing() {
    function guess(player) {
      const other = (player === user) ? opponent : user;

      game.update = 'Waiting for opponent\'s guess...';
      game.response = null;
      gameState[other].socket.emit('game', game);

      game.update = displayBoard(player);
      game.response = 'Enter your guess: ';
      game.confirm = false;
      game.eventCode = 'guess';
      gameState[player].socket.emit('game', game);
    }

    socket.on('guess', (guess) => {
      const upperGuess = guess.toUpperCase();
      if (/^[A-J]([1-9]|10)$/.test(upperGuess)) {
        const guessCoords = {
          x: parseInt(upperGuess.slice(1), 10) - 1,
          y: upperGuess.charCodeAt(0) - 'A'.charCodeAt(0),
        };

        const enemyShips = Object.entries(gameState[opponent].ships);
        let hit = false;
        outerLoop: for (let i = 0; i < 5; i++) {
          for (let j = 0; j < enemyShips[i][1].length; j++) {
            if (enemyShips[i][1][j].x === guessCoords.x && enemyShips[i][1][j].y === guessCoords.y) {
              hit = true;
              gameState[user].board[guessCoords.y][guessCoords.x] = 'X';
              enemyShips[i][1][j].hit = true;

              const shipName = enemyShips[i][0];
              let status = 'sunk';
              for (let k = 0; k < enemyShips[i][1].length; k++) {
                if (!enemyShips[i][1][k].hit) {
                  status = 'hit';
                }
              }

              game.update = `Your opponent ${status} your ${shipName} on ${upperGuess}`;
              game.response = null;
              gameState[opponent].socket.emit('game', game);

              if (status === 'sunk') {
                status = 'Sink';
              } else {
                status = 'Hit';
              }

              game.update = displayBoard(user) + `\n${status}`;
              game.response = null;
              gameState[user].socket.emit('game', game);

              setTimeout(() => {
                afterTurn(user, opponent);
              }, 2000);
              break outerLoop;
            }
          }
        }
        if (!hit) {
          gameState[user].board[guessCoords.y][guessCoords.x] = 'O';

          game.update = `Your opponent missed on ${upperGuess}`;
          game.response = null;
          gameState[opponent].socket.emit('game', game);

          game.update = displayBoard(user) + '\nMiss';
          game.response = null;
          gameState[user].socket.emit('game', game);

          setTimeout(() => {
            guess(opponent);
          }, 2000);
        }
      }
    });

    function afterTurn(lastPlayer, nextPlayer) {
      let player1Ships = 0;
      let player2Ships = 0;
      for (let i = 0; i < 5; i++) {
        if (Object.values(gameState.player1.ships)[i].length > 0) {
          player1Ships++;
        }
        if (Object.values(gameState.player2.ships)[i].length > 0) {
          player2Ships++;
        }
      }
      if (player1Ships * player2Ships > 0) {
        guess(nextPlayer);
      } else if (player1Ships > 0) {
        game.update = 'You lost. oh no';
        game.response = 'Would you like to play again? Y/N: ';
        game.confirm = true;
        game.eventCode = 'restart';
        gameState[nextPlayer].socket.emit('game', game);

        game.update = 'You won. yipdeedoo';
        game.response = null;
        gameState[lastPlayer].socket.emit('game', game);
      }
    }
  }
}

module.exports = playBattleship;
