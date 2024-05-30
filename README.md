# Game Hub

## Authors

Wajiha Khan, Jed Staley, Demarquies Jolley

## Overview

The Game Hub project involves developing a backend server that hosts classic games like Hangman, Tic Tac Toe, and other mini-games. Users will access the Game Hub through terminals connected to the server, providing a centralized platform for gaming. The project focuses on backend development to implement game logic, scoring, and multiplayer functionality. Quality assurance will ensure smooth operation, and the project will culminate in the deployment of the Game Hub server for users to enjoy classic gaming experiences.

## Instructions

[CONNECT FOUR](./games/connect-four/README.md)

## Technology Stack

- Node.js
- Readline +(sync)
- Socket.io
- Dotenv
- Chance
- Jest

- Deployment: Render.com

## Making a Game

### Prep, File Structure, and Integration

To add a game, make a new folder in the `games` folder. Add a property to the `games.json` object. The key should be your game's title in Title Case, and the value should be the path to your game's main file in its folder from `hub.js`. 

Your main file will need to export a function which will be imported by the hub (the import will be automatic if you have set up your line in `games.json` correctly). This function will be run immediately when the user selects your game, with two arguments: `socket` and the `listGames` function. 

The socket is what it sounds like; it's the socket for the current user. The `listGames` function should be called with no arguments whenever the user expresses that they would like to return to the main menu.

### User Communication

All communication to the user MUST be accomplished using this EXACT line of code (although you may rename the payload if you wish): 

```javascript
socket.emit('game', game);
```

The payload (`game`) MUST be an object that follows this format:

```javascript
{
  update: '',
  response: '',
  confirm: false,
  eventCode: 'game-start',
};
```

The properties are used in the following ways:

  - `update` should be a string which will be logged to the user's console immediately
  - `response` should be a string which will be logged to the user's console immediately before requiring user input
  - `confirm` should be a Boolean value indicating whether the client should have to confirm their input
  - `eventCode` should a string which will be the event ID on the client's responding `socket.emit`

For a more thorough understanding, here is how the client deals with all communication from games:

```javascript
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
```

### 

## Credits

- Use of ChatGPT
- Brandon Mizutani

[WIREFRAME + UML](https://www.figma.com/board/r3QEX5DV1n9hy9tveqkuVb/Cloud-Game?node-id=0-1&t=HZrGRSTxIlQsR4XD-0)

