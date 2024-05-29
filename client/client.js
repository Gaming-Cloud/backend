'use strict';

require('dotenv').config();
const HUB_URL = process.env.HUB_URL;

const io = require('socket.io-client');
const socket = io.connect(HUB_URL);
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const clearScreen = () => {
  process.stdout.write('\x1Bc');
};

socket.on('connect', () => {
  console.log('Connected to the server');
  // socket.emit('request-games-list');
});

socket.on('game-list', (gamesList) => {
  clearScreen();
  displayGamesList(gamesList);
});

socket.on('game-not-found', (gamesList) => {
  clearScreen();
  console.log('I\'m sorry, that game isn\'t working right now. Please choose again.');
  displayGamesList(gamesList);
});

function displayGamesList(gamesList) {
  console.log('Available games:');
  gamesList.forEach((game, index) => {
    console.log(`${index + 1}. ${game}`);
  });

  askForGameChoice(gamesList);
}

function askForGameChoice(gamesList) {
  rl.question(`What game would you like to play? Enter a number between 1 and ${gamesList.length}: `, (answer) => {
    const gameIndex = Number(answer) - 1;
    if (Number.isInteger(gameIndex) && gameIndex >= 0 && gameIndex < gamesList.length) {
      const chosenGame = gamesList[gameIndex];
      clearScreen();
      socket.emit('load-game', chosenGame);
      console.log('Retrieving game...');
    } else {
      clearScreen();
      console.log(`"${answer}" is not a valid input. Your options are:`);
      askForGameChoice(gamesList);
    }
  });
}

socket.on('game', (game) => {
  function getResponse() {
    clearScreen();
    if (game.update) {
      console.log(game.update);
    }
    if (game.response) {
      rl.question(game.response, (response) => {
        if (game.confirm) {
          rl.question(`You entered: "${response}"\nAre you sure? Y/N: `, (confirm) => {
            if (confirm === 'Y' || confirm === 'y') {
              socket.emit(game.eventCode, response);
            } else {
              getResponse();
            }
          });
        } else {
          socket.emit(game.eventCode, response);
        }
      });
    }

  }
  getResponse();
});

socket.on('disconnect', () => {
  clearScreen();
  console.log('Disconnected from the server');
  rl.close();
});
