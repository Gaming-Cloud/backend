'use strict';

require('dotenv').config();
const HUB_URL = process.env.HUB_URL;

const io = require('socket.io-client');
const socket = io.connect(HUB_URL);
const readlineSync = require('readline-sync');

socket.on('connected', () => {
  console.log('Connected to the server');
});

socket.on('game-list', (gamesList) => {
  displayGamesList(gamesList);
});

socket.on('game-not-found', (gamesList) => {
  console.log('I\'m sorry, that game isn\'t working right now. Please choose again.');
  displayGamesList(gamesList);
});

socket.on('game', (gameInfo) => {
  if (gameInfo.update) {
    console.log(gameInfo.update);
  }
  if (gameInfo.response) {
    const response = readlineSync.question(gameInfo.response);
    if (gameInfo.confirm) {
      const confirm = readlineSync.question(gameInfo.confirm);
      if (confirm === gameInfo.confirmation) {
        socket.emit(gameInfo.eventCode, response);
      }
    } else {
      socket.emit(gameInfo.eventCode, response);
    }
  }
});

function displayGamesList(gamesList) {
  console.log('Available games:');
  // eslint-disable-next-line no-constant-condition
  while (true) {
    gamesList.forEach((game, index) => {
      console.log(`${index + 1}. ${game}`);
    });
    const gameChoice = readlineSync.question(`What game would you like to play? Enter a number between 1 and ${gamesList.length}: `);
    const gameIndex = Number(gameChoice) - 1;
  
    if (Number.isInteger(gameIndex) && gameIndex >= 0 && gameIndex < gamesList.length) {
      const chosenGame = gamesList[gameIndex];
      socket.emit('load-game', chosenGame);
      console.log('Retrieving game...');
      break;
    } else {
      console.log(`"${gameChoice}" is not a valid input. Your options are:`);
    }
  }
}