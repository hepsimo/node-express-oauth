const express = require('express');
const bodyParser = require('body-parser');
const axios = require('axios').default;
const { randomString, timeout } = require('./utils');

const config = {
  port: 9000,

  clientId: 'my-client',
  clientSecret: 'zETqHgl0d7ThysUqPnaFuLOmG1E=',
  redirectUri: 'http://localhost:9000/callback',

  authorizationEndpoint: 'http://localhost:9001/authorize',
  tokenEndpoint: 'http://localhost:9001/token',
  userInfoEndpoint: 'http://localhost:9002/user-info'
};
let state = '';

const app = express();
app.set('view engine', 'ejs');
app.set('views', 'assets/client');
app.use(timeout);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
Your code here
*/
app.get('/authorize', (req, res) => {
  state = randomString();
  const authUrl = new URL(config.authorizationEndpoint);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('client_id', config.clientId);
  authUrl.searchParams.append('redirect_uri', config.redirectUri);
  authUrl.searchParams.append('scope', 'permission:name permission:date_of_birth');
  authUrl.searchParams.append('state', state);

  return res.redirect(authUrl);
});

app.get('/callback', (req, res) => {
  const { code: qcode, state: qstate } = req.query;
  if (state !== qstate) {
    return res.status(403).end();
  }
  else {
    axios({
      method: 'POST',
      url: config.tokenEndpoint,
      auth: { username: config.clientId, password: config.clientSecret },
      data: { code: qcode }
    }).then((postResponse) => {
      const { access_token } = postResponse.data;
      return axios({
        method: 'GET',
        url: config.userInfoEndpoint,
        headers: { authorization: `Bearer ${access_token}` }
      }).then((getResponse) => {
        res.render('welcome', { user: getResponse.data });
      });
    });
  }
});

const server = app.listen(config.port, 'localhost', function() {
  var host = server.address().address;
  var port = server.address().port;
});

// for testing purposes

module.exports = {
  app,
  server,
  getState() {
    return state;
  },
  setState(s) {
    state = s;
  }
};
