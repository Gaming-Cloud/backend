'use strict';

function playHangman(socket, listGames) {
  const fullCategories = require('./data.json').categories;
  const preCategories = Object.keys(fullCategories);
  const categories = preCategories.map((str) => str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, char => char.toUpperCase()));
  const stickFigures = require('./data.json').stickFigures;
  
  let stage;
  let word;
  let shownWord;

  const game = {
    update: '',
    response: '',
    confirm: false,
    eventCode: 'game-start',
  };

  const invalidResponse = () => {
    game.update = 'I\'m sorry, but your response wasn\'t a valid option. Please try again.\n' + game.update;
    socket.emit('game', game);
  };

  const gameStart = () => {
    stage = 0;
    word = '';
    shownWord = '';
    game.update = 'Available categories:';
    for (let i = 0; i < categories.length; i++) {
      game.update += `\n${i + 1}. ${categories[i]}`;
    }
    game.response = `Choose a category. Enter a number between 1 and ${categories.length}:`;
    game.eventCode = 'category-choice';
    socket.emit('game', game);
  };

  gameStart();

  socket.on('category-choice', (choice) => {
    const num = parseInt(choice, 10);
    if (isNaN(num) || !(num > 0 && num <= categories.length)) {
      invalidResponse();
    } else {
      const category = fullCategories[preCategories[num - 1]];
      const index = Math.floor(Math.random() * category.length);
      word = category[index].toUpperCase();
      // eslint-disable-next-line no-unused-vars
      for (let char of word) {
        shownWord += '_';
      }
      game.update = `Your word is: ${shownWord}\n${stickFigures[stage]}`;
      game.response = 'Guess a letter: ';
      game.eventCode = 'guess';
      socket.emit('game', game);
    }
  });

  socket.on('guess', (guess) => {
    const upperGuess = guess.toUpperCase();
    if (!/^[A-Z]$/.test(upperGuess)) {
      invalidResponse();
    } else {
      let changes = 0;
      for (let i = 0; i < word.length; i++) {
        if (upperGuess === word[i]) {
          shownWord = shownWord.split('');
          shownWord[i] = upperGuess;
          shownWord = shownWord.join('');
          changes++;
        }
      }
      if (!changes) {
        stage++;
        if (stage === 6) {
          game.update = `Oh no, you're out of guesses!\n${stickFigures[stage]}`;
          game.response = 'Would you like to play again? Y/N: ';
          game.eventCode = 'game-restart';
          socket.emit('game', game);
        } else {
          game.update = `Sorry, there are no ${upperGuess}'s in the word.\nYour word is: ${shownWord}\n${stickFigures[stage]}`;
          socket.emit('game', game);
        }
      } else {
        if (!/_/.test(shownWord)) {
          game.update = `You won! The word was: ${word}`;
          game.response = 'Would you like to play again? Y/N: ';
          game.eventCode = 'game-restart';
          socket.emit('game', game);
        } else {
          game.update = `Nice, there were ${changes} ${upperGuess}'s in the word!\nYour word is: ${shownWord}\n${stickFigures[stage]}`;
          socket.emit('game', game);
        }
      }
    }
  });

  socket.on('game-restart', (choice) => {
    const upperChoice = choice.toUpperCase();
    if (upperChoice === 'Y') {
      gameStart();
    } else if (upperChoice === 'N') {
      listGames();
    } else {
      invalidResponse();
    }
  });
}

module.exports = playHangman;