const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const { randomString, containsAll, decodeAuthCredentials, timeout } = require('./utils');

const config = {
  port: 9001,
  privateKey: fs.readFileSync('assets/private_key.pem'),
  publicKey: fs.readFileSync('assets/public_key.pem'),

  clientId: 'my-client',
  clientSecret: 'zETqHgl0d7ThysUqPnaFuLOmG1E=',
  redirectUri: 'http://localhost:9000/callback',

  authorizationEndpoint: 'http://localhost:9001/authorize'
};

const clients = {
  'my-client': {
    name: 'Sample Client',
    clientSecret: 'zETqHgl0d7ThysUqPnaFuLOmG1E=',
    scopes: [ 'permission:name', 'permission:date_of_birth' ]
  },
  'test-client': {
    name: 'Test Client',
    clientSecret: 'TestSecret',
    scopes: [ 'permission:name' ]
  }
};

const users = {
  user1: 'password1',
  john: 'appleseed'
};

const requests = {};
const authorizationCodes = {};

let state = '';

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'assets/authorization-server');
app.use(timeout);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
Your code here
*/
app.get('/authorize', (req, res) => {
  const { query } = req;
  const clientId = query.client_id;
  if (clientId in clients) {
    const wantedScopes = query.scope.split(' ');
    if (containsAll(clients[clientId].scopes, wantedScopes)) {
      const requestId = randomString();
      requests[requestId] = query;
      return res.status(200).render('login', { client: clients[clientId], scope: query.scope, requestId: requestId });
    }
  }
  return res.status(401).end();
});

app.post('/approve', (req, res) => {
  const { userName, password, requestId } = req.body;
  if (users[userName] === password) {
    const request = requests[requestId];
    if (request) {
      delete requests[requestId];
      const authCodeId = randomString();
      authorizationCodes[authCodeId] = { clientReq: request, userName: userName };
      const { redirect_uri, state } = request;
      const redirectUri = new URL(redirect_uri);
      redirectUri.searchParams.append('code', authCodeId);
      redirectUri.searchParams.append('state', state);
      return res.redirect(redirectUri.href);
    }
  }
  return res.status(401).end();
});

app.post('/token', (req, res) => {
  if (req.headers.authorization) {
    const { clientId, clientSecret } = decodeAuthCredentials(req.headers.authorization);
    if (clients[clientId].clientSecret === clientSecret) {
      const { code } = req.body;
      if (authorizationCodes[code]) {
        const authorization = authorizationCodes[code];
        delete authorizationCodes[code];
        const payload = { userName: authorization.userName, scope: authorization.clientReq.scope };
        const signOptions = {
          expiresIn: '10m',
          algorithm: 'RS256'
        };
        const token = jwt.sign(payload, config.privateKey, signOptions);
        return res.status(200).json({ token_type: 'Bearer', access_token: token });
      }
    }
  }
  return res.status(401).end();
});

const server = app.listen(config.port, 'localhost', function() {
  var host = server.address().address;
  var port = server.address().port;
});

// for testing purposes

module.exports = { app, requests, authorizationCodes, server };
