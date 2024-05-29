'use strict';

require('dotenv').config();
const PORT = process.env.PORT || 3000;
const io = require('socket.io')(PORT);

const games = require('./games.json');
const gamesList = Object.keys(games);
console.log(gamesList);

io.on('connection', (socket) => {
  console.log('User connected, ID', socket.id);

  function listGames() {
    socket.emit('game-list', gamesList);
  }

  listGames();

  socket.on('request-games-list', () => {
    socket.emit('game-list', gamesList);
  });

  socket.on('load-game', (gameTitle) => {
    const gamePath = games[gameTitle];
    if (gamePath) {
      const loadGame = require(gamePath);
      loadGame(socket, listGames);
    } else {
      socket.emit('game-not-found', gamesList);
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected, ID:', socket.id);
  });
});
