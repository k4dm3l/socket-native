'use strict'

const { Socket } = require('net');
const readline = require('readline').createInterface({
  input: process.stdin,
  output: process.stdout
});
const PROTOCOL = require('./protocol');

const END = 'END';

// AUXILIAR FUNCTIONS
const errorHandler = (message) => {
  console.log(message);
  process.exit(1);
};

const connectToServer = (host, port) => {
  console.log(`Connecting to ${host}:${port}`);

  const socketClient = new Socket();
  socketClient.connect({ host, port });
  socketClient.setEncoding('utf-8');

  // ERROR SERVER EVENT HANDLER
  socketClient.on('error', (error) => console.log(error.message));
  
  // DISCONNECTION CLIENT EVENT HANDLER
  socketClient.on('close', () => {
    console.log(`Disconnected`)
    process.exit(0);
  });

  socketClient.on('connect', () => {
    console.log(`Connected to server: ${host}:${port}`);

    readline.question('Choose your username: ', (username) => {
      socketClient.write(username);
      console.log(`Type any message to send it, type /END to close your chat`);
    });

    // SEND MESSAGE FROM CLIENT
    readline.on('line', (message) => {
      socketClient.write(message);

      if (message.startsWith(PROTOCOL.MESSAGE_COMMANDS.ROOT_COMMANDS)) {
        const keyword = message.split('/')[1];
        const closeChat = PROTOCOL.MESSAGE_COMMANDS.KEYWORDS.find(command => keyword === command);

        if (closeChat && closeChat === 'END') {
          socketClient.end();  
        }
      }
    });

    socketClient.on('data', (message) => {
      console.log(message);
    });
  });
};

const main = () => {
  if (process.argv.length !== 4) {
    errorHandler(`Usage: node CLIENT_FILE_PATH IP_HOST PORT`);
  }

  let [ , , host, port ] = process.argv;

  if (isNaN(port)) {
    errorHandler(`Invalid port number ${port}`);
  }

  port = Number(port);

  if (!Number.isInteger(port)) {
    errorHandler(`Invalid port number ${port}`);
  }

  connectToServer(host, port);
};

if (require.main === module) {
  main();
}