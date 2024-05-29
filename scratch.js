'use strict';

const readlineSync = require('readline-sync');

console.log('hello');

const gameChoice = readlineSync.question(`What game would you like to play? Enter a number between 1 and 4: `);

console.log('world');
console.log('You chose:', gameChoice);
