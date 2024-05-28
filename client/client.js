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

socket.on('connect', () => {
  console.log('Connected to the server');
});

socket.on('game-list', (gamesList) => {
  displayGamesList(gamesList);
});

socket.on('game-not-found', (gamesList) => {
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
      console.log('chosen', chosenGame);
      socket.emit('load-game', chosenGame);
      console.log('Retrieving game...');
    } else {
      console.log(`"${answer}" is not a valid input. Your options are:`);
      askForGameChoice(gamesList);
    }
  });
}

socket.on('game', (gameInfo) => {
  if (gameInfo.update) {
    console.log(gameInfo.update);
  }
  if (gameInfo.response) {
    rl.question(gameInfo.response, (response) => {
      if (gameInfo.confirm) {
        rl.question(gameInfo.confirm, (confirm) => {
          if (confirm === gameInfo.confirmation) {
            socket.emit(gameInfo.eventCode, response);
          }
        });
      } else {
        socket.emit(gameInfo.eventCode, response);
      }
    });
  }
});

socket.on('disconnect', () => {
  console.log('Disconnected from the server');
  rl.close();
});
