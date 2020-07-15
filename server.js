'use strict';

const PORT = process.env.PORT || 3000;
const express = require('express');
const bodyParser = require('body-parser');
const escapeHtml = require('escape-html');
const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const exphbs = require('express-handlebars');
const basicAuth = require('express-basic-auth');
const settings = require('./app')
const DB = require('./DB');
var db = new DB();


app.engine('handlebars', exphbs({ defaultLayout: false }));
app.set('view engine', 'handlebars');

app.use(bodyParser.text());
app.use(express.static('public'));




/**
 * Configure basic auth
 */
const USE_AUTH = process.env.PEASHOOTER_USERNAME && process.env.PEASHOOTER_PASSWORD;
if (USE_AUTH) {
  app.use(basicAuth({
      users: { [process.env.PEASHOOTER_USERNAME]: process.env.PEASHOOTER_PASSWORD },
      challenge: true,
      unauthorizedResponse: (req) => { return '401 Authorization Required'; }
  }));
}

app.get('/', function(req, res) {
  res.render('index', {
    title: process.env.PEASHOOTER_TITLE || settings.name,
    github: settings.repository,
    url: buildUrl(req),
    show_info: !process.env.PEASHOOTER_HIDE_INFO,
    use_auth: USE_AUTH,
    user: process.env.PEASHOOTER_USERNAME || '',
    pass: process.env.PEASHOOTER_PASSWORD || ''
  });
});

/**
 * Lists all the logs
 */
app.get('/list', function(req, res) {
  res.status(200).send(db.getAllEntrys());
  // knex('entries')
  // .select('*')
  // .then((entries) => {
    
  // }).catch((err) => {
  //   sendError(res, err);
  // });
});

/**
 * Logs a new line
 */
app.post('/log', function(req, res) {
  const contentType = req.headers['content-type'];
  if (!contentType || contentType.indexOf('text/plain') !== 0) {
    return sendError(res, new Error('Entry must have content-type of "text/plain"'), 400);
  }

  if (typeof req.body !== 'string') {
    return sendError(res, new Error('Entry must be a string.'), 400);
  }

  if (req.body.length === 0) {
    return sendError(res, new Error('Entry must have a length greater than 0.'), 400); 
  }

  var rowId = db.insertEntry(escapeHtml(req.body)).lastInsertRowid;
  var entry = db.getEntry(rowId);
  io.emit('entry', entry);
  res.status(200).send(entry);
 
});

/**
 * Clears all the logs
 */
app.post('/clear', function(req, res) {
  db.clear();
  var count = 1;
  io.emit('clear', { count });
  res.status(200).send({ count });
});

server.listen(PORT, function () {
  console.log(`Peashooter listening on port ${PORT}!`);
});


function buildUrl(req) {
  return req.protocol + '://' + req.get('host');
}

function sendError(res, err) {
  const json = {
    error: err.toString()
  };

  io.emit('error', json);
  res.status(500).send(json);
}
