'use strict';

function playHangman(socket) {
  const stickFigures = require('./hangman.json').stickFigures;
  const game = {
    update: '',
    response: '',
    confirm: true,
    confirmation: null,
    eventCode: 'game-start',
  };

  const gameStart = () => {
    const preCategories = Object.keys(require('./hangman.json').categories);
    const categories = preCategories.map((str) => str.replace(/([a-z])([A-Z])/g, '$1 $2').replace(/\b\w/g, char => char.toUpperCase()));
    const 
  };  

  socket.emit('game', game);
  socket.on('game-start', (choice) => {
    switch(choice) {
      case 'c':

    }
  });

  function handleGameSelection() {
    socket.emit('requestGamesList');
    socket.on('gamesList', (games) => {
      console.log('Available games:');
      games.forEach((game, index) => {
        console.log(`${index + 1}. Game ID: ${game.id}`);
      });

      if (!gameSelectionCompleted) {
        let choice = readlineSync.question('Enter game number to join or "c" to create a new game: ');
        if (choice.toLowerCase() === 'c') {
          socket.emit('createGame', selectedCategory);
        } else {
          let gameIndex = parseInt(choice) - 1;
          if (games[gameIndex]) {
            gameId = games[gameIndex].id;
            socket.emit('joinGame', gameId);
            gameSelectionCompleted = true;
          } else {
            console.log('Invalid choice. Exiting...');
            process.exit();
          }
        }
      }
    });
  }

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


  socket.on('startGame', (game) => {
    gameId = game.id;
    console.log(`Game started in category ${game.category}! Word: ${'_ '.repeat(game.word.length)}`);
    playGame(game);
  });

  socket.on('updateGame', (game) => {
    playGame(game);
  });

  socket.on('alreadyGuessed', (letter) => {
    console.log(`You have already guessed the letter "${letter}". Try again.`);
    playGame(currentGame); 
  });

  socket.on('gameWon', () => {
    console.log('Congratulations! You guessed the word!');
    process.exit();
  });

  socket.on('gameLost', () => {
    console.log(`Game over! The word was: ${currentGame.word}`);
    process.exit();
  });

  let currentGame = null;

  function playGame(game) {
    currentGame = game;
    let displayWord = game.word
      .split('')
      .map(letter => game.guesses.includes(letter) || letter === ' ' ? letter : '_')
      .join(' ');

    let incorrectGuesses = game.guesses.filter(letter => !game.word.includes(letter) && letter !== ' ').length;

    console.clear();
    console.log(stickFigures[incorrectGuesses]);
    console.log(`Word: ${displayWord}`);
    console.log(`Attempts left: ${game.attempts}`);
    console.log(`Guessed letters: ${game.guesses.join(', ')}`);

    if (!displayWord.includes('_')) {
      console.log('Congratulations! You guessed the word!');
      process.exit();
    } else if (game.attempts > 0) {
      let guess = readlineSync.question('Guess a letter or the entire word: ');

      if (guess.length === 1) {
        if (game.guesses.includes(guess)) {
          console.log(`You have already guessed the letter "${guess}". Try again.`);
          playGame(game);
        } else {
          socket.emit('guess', { gameId: gameId, letter: guess });
        }
      } else {
        // Ignore spaces when comparing guesses to the actual word
        const sanitizedGuess = guess.replace(/\s+/g, '');
        const sanitizedWord = game.word.replace(/\s+/g, '');

        if (sanitizedGuess.toLowerCase() === sanitizedWord.toLowerCase()) {
          // If the entire word is guessed correctly
          socket.emit('guessWord', { gameId: gameId, word: guess });
        } else {
          console.log(`Incorrect word guess. The correct answer is: ${game.word}`);
          socket.emit('gameLost');
          process.exit();
        }
      }
    } else {
      console.log(`Game over! The word was: ${game.word}`);
      process.exit();
    }
  }
}

module.exports = playHangman;