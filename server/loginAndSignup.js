const bcrypt = require('bcrypt-nodejs');
const jwt = require('jsonwebtoken');
const DeepstreamClient = require('deepstream.io-client-js');
const EventEmitter = require('events').EventEmitter;
const util = require('util');

const Provider = function (config) {
  this._jwtSecret = config.jwtSecret;
  this.isReady = false;
  this._config = config;
  this._logLevel = config.logLevel !== undefined ? config.logLevel : 1;
  this._deepstreamClient = null;
};

util.inherits(Provider, EventEmitter);

Provider.prototype.start = function () {
  this._initialiseDeepstreamClient();
};

Provider.prototype.stop = function () {
  this._deepstreamClient.close();
};

Provider.prototype.log = function (message, level) {
  if (this._logLevel < level) {
    return;
  }

  const date = new Date();
  const time = `${date.toLocaleTimeString()}:${date.getMilliseconds()}`;

  console.log(`${time}::Accounts::${message}`);
};

Provider.prototype._initialiseDeepstreamClient = function () {
  this.log('Initialising Deepstream connection', 1);

  if (this._config.deepstreamClient) {
    this._deepstreamClient = this._config.deepstreamClient;
    this.log('Deepstream connection established', 1);
    this._ready();
  } else {
    if (!this._config.deepstreamUrl) {
      throw new Error('Can\'t connect to deepstream, neither deepstreamClient nor deepstreamUrl were provided', 1);
    }

    if (!this._config.deepstreamCredentials) {
      throw new Error('Missing configuration parameter deepstreamCredentials', 1);
    }

    this._deepstreamClient = new DeepstreamClient(this._config.deepstreamUrl);
    this._deepstreamClient.on('error', (error) => {
      console.log(error);
    });
    this._deepstreamClient.login(
      this._config.deepstreamCredentials,
      this._onDeepstreamLogin.bind(this)
      );
  }
};

Provider.prototype._onDeepstreamLogin = function (success, error, message) {
  if (success) {
    this.log('Connection to deepstream established', 1);
    this._ready();
  } else {
    this.log(`Can't connect to deepstream: ${message}`, 1);
  }
};

Provider.prototype._ready = function () {
  this.log('Provider ready', 1);
  this.isReady = true;
  this.emit('ready');
};

Provider.prototype.checkJWT = function (token, res) {
  jwt.verify(token, this._jwtSecret, (err, decoded) => {
    if (decoded) {
      this._deepstreamClient.record.snapshot(`user/${decoded.username}`, (anErr, data) => {
        console.log('data is: ', data);
        if (anErr) {
          this.log('Failed to find user in users table');
        }
        bcrypt.compare(decoded.password, data.password, (theErr, correctPassword) => {
          if (theErr) {
            this.log('Failed to compare hashed password');
          } else if (correctPassword) {
            this.log('Valid JWT token');
            res.status(200).send({
              clientData: {
                recordID: `user/${decoded.username}`,
                userID: data.username,
                token: data.token
              },
              serverData: { role: 'user' }
            });
          }
        });
      });
    } else {
      res.status(403).send();
    }
  });
};

Provider.prototype.checkLogin = function (results, req, res) {
  const theUsername = req.body.authData.username;
  this._deepstreamClient.record.snapshot(`user/${theUsername}`, (error, data) => {
    if (error) {
      res.status(403).send('Invalid credentials');
    } else {
      bcrypt.compare(req.body.authData.password, data.password, (err, correctPassword) => {
        if (err) {
          res.status(403).send('Password not found');
        } else if (correctPassword) {
          jwt.sign(req.body.authData, this._jwtSecret, { expiresIn: '7d' }, (err, token) => {
            this._deepstreamClient.record
                .getRecord(`user/${theUsername}`)
                .whenReady((userRecord) => {
                  userRecord.set('token', token, (err) => {
                    if (err) {
                      this.log(`Error while setting token for ${theUsername}`);
                    } else {
                      res.status(200).send({
                        clientData: {
                          recordID: `user/${req.body.authData.username}`,
                          userID: req.body.authData.username,
                          token,
                        },
                        serverData: {
                          role: 'user',
                          userID: req.body.authData.username
                        },
                      });
                    }
                  });
                });
          });
        } else {
          res.status(403).send('Invalid credentials');
        }
      });
    }
  }, true);
};

Provider.prototype.signUp = function (body, res) {
  const checkForDuplicateUser = new Promise((resolve, reject) => {
    this._deepstreamClient.record.snapshot(`user/${body.username}`, (error, data) => {
      if (error) {
        resolve();
      }
      if (data) {
        reject({
          reason: `${body.username} already exists`,
          type: 'username'
        });
      }
    });
  });

  const checkForDuplicateEmail = new Promise((resolve, reject) => {
    this._deepstreamClient.record.snapshot(`email/${body.email}`, (error, data) => {
      if (error) {
        resolve();
      }
      if (data) {
        reject({
          reason: `${body.email} already exists`,
          type: 'email'
        });
      }
    });
  });

  Promise.all([checkForDuplicateUser, checkForDuplicateEmail]).then(() => {
    bcrypt.genSalt(10, (error, salt) => {
      bcrypt.hash(body.password, salt, null, (err, hashedPassword) => {
        this._deepstreamClient.record.getRecord(`user/${body.username}`).whenReady((newUserRecord) => {
          newUserRecord.set('username', body.username);
          newUserRecord.set('password', hashedPassword);
          newUserRecord.set('email', body.email);
        });
        this._deepstreamClient.record.getRecord(`email/${body.email}`).whenReady((newEmailRecord) => {
          newEmailRecord.set('email', body.email);
          newEmailRecord.set('password', hashedPassword);
          res.status(200).send('new user has been created');
        });
        this._deepstreamClient.event.emit('initBalance', { userID: body.username });
      });
    });
  }).catch((reason) => {
    this.log(`New account - Promise rejection: ${reason}`);
    res.status(403).send(`${reason.type} is already taken`);
  });
};

module.exports = Provider;
