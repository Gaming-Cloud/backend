'use strict';

const EventEmitter = require('events');

class GameEventEmitter extends EventEmitter {}

module.exports = new GameEventEmitter();
