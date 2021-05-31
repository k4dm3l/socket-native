'use strict'

// REQUIREMENTS
const { Server } = require('net');
const PROTOCOL = require('./protocol');

// CONSTANTS
const HOST = '127.0.0.1';

// CONNECTED SOCKETS
const connections = new Map();

// AUXILIAR FUNCTIONS
const errorHandler = (message) => {
  console.log(message);
  process.exit(1);
};

const sendBroadCastMessage = (message, origin) => {
  for (const socket of connections.keys()) {
    if (socket !== origin) {
      socket.write(message);
    }
  }
};

const sendDirectMessage = (message, socketOrigin, socketDestination) => {
  const socket = connections.get(socketDestination);

  if (!socket) {
    errorHandler('No user identified with that username');
  }

  if (socketDestination === socketOrigin) {
    errorHandler('It is not possible send a message to yourself');
  }

  socketDestination.write(message);
};

const startSocketServer = (port, host = HOST) => {
  // INSTANCE SERVER
  const socketServer = new Server();

  // ERROR SERVER EVENT HANDLER
  socketServer.on('error', (error) => console.log(error.message));

  socketServer.on('connection', (socket) => {
    const clientSocket = `${socket.remoteAddress}:${socket.remotePort}`;
    console.log(`New connection -> ${clientSocket}`);
    socket.setEncoding('utf-8');

    // ERROR CLIENT EVENT HANDLER
    socket.on('error', (error) => errorHandler(error.message));

    // DISCONNECTION CLIENT EVENT HANDLER
    socket.on('close', () => {
      console.log(`Client connection closed -> ${clientSocket}`);
    });

    // EXCHANGE DATA WITH CLIENT
    socket.on('data', (message) => {
      if (!connections.has(socket)) {
        console.log(`Username ${message} set for connection ${clientSocket}`);
        sendBroadCastMessage(`[${message}] Connected`, socket);
        connections.set(socket, message);

        //console.log(connections.keys())

      } else {
        if (message.startsWith(PROTOCOL.MESSAGE_COMMANDS.ROOT_COMMANDS)) {
          const keyword = message.split('/')[1];

          if (!keyword) {
            sendDirectMessage('Error - not command specified', null, socket)
          }

          let closeChat = PROTOCOL.MESSAGE_COMMANDS.KEYWORDS.find(command => keyword === command);
          
          if (closeChat && closeChat === 'END') {
            sendBroadCastMessage(`[${connections.get(socket)}] Disconnected`, socket);
            connections.delete(socket);
            socket.end();
          } else {
            let mappedUsers = [];
            
            [ ...connections.entries() ].map(connectedUsers => {
              mappedUsers.push({ user: connectedUsers[1], socket: connectedUsers[0] });
            });

            const userDirectMessage = mappedUsers.find(objUser => objUser.user === keyword.split(' ')[0]);

            if (!userDirectMessage) {
              sendDirectMessage(`Error - '${keyword}' not found it`, null, socket);
            } else if (userDirectMessage) {
              console.log(`${clientSocket} -> FROM: [${connections.get(socket)}] - TO: [${userDirectMessage.user}] : ${message.split(`/${userDirectMessage.user}`)[1].trim()}`);
              sendDirectMessage(
                `[PRIVATE][${userDirectMessage.user}] : ${message.split(`/${userDirectMessage.user}`)[1].trim()}`,
                socket, 
                userDirectMessage.socket
              );
            } else {
              sendDirectMessage(`[PRIVATE] Error - '${message}' not recognized`, null, socket);
            }
          }
        } else {
          const dataToSend = `[${connections.get(socket)}] : ${message}`;
          console.log(`${clientSocket} -> ${dataToSend}`);
          sendBroadCastMessage(dataToSend, socket);
        }
      }
    });
  });

  // START LISTEN SERVER
  socketServer.listen({ host, port }, () => console.log(`Socket server running on port ${port}`));
};

const main = () => {
  if (process.argv.length !== 3) {
    errorHandler(`Usage: node SERVER_FILE_PATH PORT`);
  }

  let port = Number(process.argv[2] || '');

  if (isNaN(port)) {
    errorHandler(`Invalid port number ${port}`);
  }

  if (!Number.isInteger(port)) {
    errorHandler(`Invalid port number ${port}`);
  }

  startSocketServer(port);
};

if (require.main === module) {
  main()
}