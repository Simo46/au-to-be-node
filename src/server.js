const app = require('./app');
const http = require('http');
require('dotenv').config();

// Normalizzazione della porta
const normalizePort = (val) => {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    return val;
  }

  if (port >= 0) {
    return port;
  }

  return false;
};

// Porta su cui il server ascolterà
const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);

// Creazione del server HTTP
const server = http.createServer(app);

// Gestione degli errori del server
const onError = (error) => {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ? 'Pipe ' + port : 'Port ' + port;

  // Gestione di errori specifici con messaggi amichevoli
  switch (error.code) {
    case 'EACCES':
      console.error(`${bind} requires elevated privileges`);
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(`${bind} is already in use`);
      process.exit(1);
      break;
    default:
      throw error;
  }
};

// Evento "listening"
const onListening = () => {
  const addr = server.address();
  const bind = typeof addr === 'string' ? 'pipe ' + addr : 'port ' + addr.port;
  console.log(`Server listening on ${bind}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
};

// Avvio del server
server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

module.exports = server;