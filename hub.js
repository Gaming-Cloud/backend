'use strict';

require('dotenv').config();
const PORT = process.env.PORT || 3000;
const io = require('socket.io')(PORT);

const games = require('./games.json');
const gamesList = Object.keys(games);

io.on('connection', (socket) => {
  console.log('User connected, ID', socket.id);

  socket.emit('game-list', gamesList);

  socket.on('request-games-list', () => {
    socket.emit('game-list', gamesList);
  });

  socket.on('load-game', (gameTitle) => {
    const gamePath = games[gameTitle];
    if (gamePath) {
      const loadGame = require(gamePath);
      loadGame(socket);
    } else {
      socket.emit('game-not-found', gamesList);
    }
  });

  socket.on('createGame', (category) => {
    if (categories[category]) {
      // Create a new game
      let newGame = {
        id: `game-${games.length + 1}`,
        word: categories[category][Math.floor(Math.random() * categories[category].length)],
        attempts: 6,
        guesses: [],
        category: category
      };
      games.push(newGame);
      socket.join(newGame.id);
      io.to(newGame.id).emit('startGame', newGame);
    } else {
      socket.emit('invalidCategory');
    }
  });

  socket.on('guess', (data) => {
    let game = games.find(g => g.id === data.gameId);
    if (game) {
      if (!game.guesses.includes(data.letter)) {
        game.guesses.push(data.letter);
        if (!game.word.includes(data.letter)) {
          game.attempts--;
        }
        io.to(game.id).emit('updateGame', game);
      } else {
        socket.emit('alreadyGuessed', data.letter);
      }
    }
  });

  socket.on('guessWord', (data) => {
    let game = games.find(g => g.id === data.gameId);
    if (game) {
      if (data.word === game.word) {
        game.guesses = game.word.split('');
        io.to(game.id).emit('updateGame', game);
        io.to(game.id).emit('gameWon');
      } else {
        game.attempts = 0;
        io.to(game.id).emit('updateGame', game);
        io.to(game.id).emit('gameLost');
      }
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected: ' + socket.id);
  });
});

server.listen(3000, () => {
  console.log('Server is running on port 3000');
});


//  COMMENTED OUT BOTTOM PORITON TO TEST HANGMAN

// const express = require('express');
// const app = express();
// const http = require('http').Server(app);
// const io = require('socket.io')(http);
// const ticTacToe = require('./games/tictactoe');

// // Total Players
// let players = 0;
// // Id of player one and player 2
// let playerOne;
// let playerTwo;

// // Run when a player is connected
// io.on("connection", socket => {
//     console.log("connected");
//     if (players === 0) {
//         // Player 1 initialized
//         socket.emit("message", 1);
//         playerOne = socket.id;
//         players++;
//     } else if (players === 1) {
//         // Player 2 initialized
//         socket.emit("message", 2);
//         playerTwo = socket.id;
//         players++;
//         // Starting the game only if player 2 is connected
//         io.to(playerOne).emit("turn", "Game Started you are first");
//     } else {
//         // Invalid amount of players
//         socket.emit("message", -1);
//     }
//     // Subtracts the total players when disconnected
//     socket.on("disconnect", () => {
//         if (players !== 0) {
//             players--;
//         }
//         return;
//     })
// });

// console.log('tictactoe', ticTacToe);
// io.on('tic-tac-toe', ticTacToe(io))

// http.listen(3000, () => {
//     console.log('Server is running on port 3000');
// });

