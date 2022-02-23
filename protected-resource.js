const express = require('express');
const bodyParser = require('body-parser');
const fs = require('fs');
const { timeout } = require('./utils');
const jwt = require('jsonwebtoken');

const config = {
  port: 9002,
  publicKey: fs.readFileSync('assets/public_key.pem')
};

const users = {
  user1: {
    username: 'user1',
    name: 'User 1',
    date_of_birth: '7th October 1990',
    weight: 57
  },
  john: {
    username: 'john',
    name: 'John Appleseed',
    date_of_birth: '12th September 1998',
    weight: 87
  }
};

const app = express();
app.use(timeout);
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

/*
Your code here
*/
app.get('/user-info', (req, res) => {
  const { authorization } = req.headers;

  if (authorization) {
    const token = authorization.slice('Bearer '.length);
    try {
      const jot = jwt.verify(token, config.publicKey, { algorithms: [ 'RS256' ] });
      const scopes = jot.scope.split(' ');
      const keyNames = scopes.map((s) => s.slice('permission:'.length));
      const data = pick(users[jot.userName], keyNames);
      return res.status(200).json(data);
    } catch (err) {
      // fall through
    }
  }
  return res.status(401).end();
});

/**
 * A pure function to pick specific keys from object, similar to https://lodash.com/docs/4.17.4#pick
 * @param {Object}obj: The object to pick the specified keys from
 * @param {Array}keys: A list of all keys to pick from obj
 */
const pick = (obj, keys) =>
  Object.keys(obj).filter((i) => keys.includes(i)).reduce((acc, key) => {
    acc[key] = obj[key];
    return acc;
  }, {});

const server = app.listen(config.port, 'localhost', function() {
  var host = server.address().address;
  var port = server.address().port;
});

// for testing purposes
module.exports = {
  app,
  server
};
