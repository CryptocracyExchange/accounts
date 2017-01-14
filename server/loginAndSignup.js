const bcrypt = require('bcrypt-nodejs');

const DeepstreamClient = require('deepstream.io-client-js');
const EventEmitter = require('events').EventEmitter;
const util = require('util');

const Provider = function (config) {
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

Provider.prototype.checkLogin = function (results, req, res) {
  const theUsername = req.body.authData.username;
  this._deepstreamClient.record.snapshot(`user/${theUsername}`, (error, data) => {
    if (error) {
      res.status(403).send('Invalid credentials');
    } else {
      bcrypt.compare(req.body.authData.password, data.password, (err, correctPassword) => {
        if (error) {
          res.status(403).send('Password not found');
        } else if (correctPassword) {
          res.status(200).send({
            clientData: {
              recordID: `user/${req.body.authData.username}`,
              userID: req.body.authData.username,
            },
            serverData: { role: 'user' },
          });
        } else {
          res.status(403).send('Invalid credentials');
        }
      });
    }
  }, true);
};

Provider.prototype.signUp = function (body, res) {
  // check if user exists
  console.log('gets into signUp function');
  const checkForDuplicateUser = new Promise((resolve, reject) => {
    this._deepstreamClient.record.snapshot(`user/${body.username}`, (error, data) => {
      console.log('user: error is', error, 'data is ', data);
      if (error) {
        console.log('hits error: ', error);
        resolve();
      }
      if (data) {
        console.log('user: hits data', data);
        res.status(403).send('Username already taken');
        reject();
      }
    });
  });
    // if yes return 403 Invalid Credentials
  // check if email exists
  const checkForDuplicateEmail = new Promise((resolve, reject) => {
    this._deepstreamClient.record.snapshot(`email/${body.email}`, (error, data) => {
      console.log('email: error is ', error, 'data is ', data);
      if (error) {
        console.log('hits error: ', error);
        resolve();
      }
      if (data) {
        console.log('email: hits data', data);
        res.status(403).send('Email already taken');
        reject();
      }
    });
  });

  Promise.all([checkForDuplicateUser, checkForDuplicateEmail]).then(() => {
    console.log('New username and new email!');
    bcrypt.genSalt(10, (error, salt) => {
      console.log('salt is: ', salt);
      bcrypt.hash(body.password, salt, null, (err, hashedPassword) => {
        console.log('hashed password is: ', hashedPassword);
        // body.password = hashedPassword;
        this._deepstreamClient.record.getRecord(`user/${body.username}`).whenReady((newUserRecord) => {
          newUserRecord.set('username', body.username);
          newUserRecord.set('password', hashedPassword);
          newUserRecord.set('email', body.email);
        });
        this._deepstreamClient.record.getRecord(`email/${body.email}`).whenReady((newEmailRecord) => {
          newEmailRecord.set('email', body.email);
          newEmailRecord.set('password', hashedPassword);
        });
      });
    });
  });
};

module.exports = Provider;

  // if yes return 403 Invalid Credentials
// if neither exists
  // generate salt
  // hashPassword
  // create user record with username, password, email
  // create email record with email, password
/*
const hashPasswordSignUp = function(body, res) {
  console.log('hits hashPasswordSignUp function');
  console.log('body.password is: ', body.password);
  bcrypt.genSalt(10, function (error, salt) {
    console.log('salt is: ', salt)
    bcrypt.hash(body.password, salt, null, function(error, results) {
      console.log('results is', results);
      body.password = results;
      const checkThisRecordName = 'user/' + body.username;
      client.record.has(checkThisRecordName, function(error, hasRecord) {
        if (error) {
          return res.status(403).send('Invalid Credentials');
        } else if (hasRecord) {
          return res.status(403).send('User already exists');
        } else {
          let allUsersList = client.record.getList('allUsersList').whenReady(function(list){
            let allUsersArr = list.getEntries();
            for (let i = 0; i < allUsersArr.length; i++) {
              let usernameRegExp = new RegExp('^user/' + body.username, 'gi');
              let usernameExists = usernameRegExp.test(allUsersArr[i]);
              if (usernameExists) {
                console.log('the username has already been used!');
                return res.status(403).send('the username has already been used');
              }
            }
            // let emailRegExp = new RegExp(body.email + '$', 'gi');
            let findEmail = JSON.stringify({
              table: 'user',
              query: [
                ['email', 'eq', body.email]
              ]
            })
            let queryResults = client.record.getList('search?' + findEmail);
            queryResults.subscribe
            queryResults.whenReady(function(list) {
              let emailTaken = list.getEntries();
              if (emailTaken.length !== 0) {
                // list.discard();
                res.status(403).send('the email has already been used');
              } else {
                // list.discard();
                const user = client.record.getRecord('user/' + body.username).whenReady(function(user) {
                user.set('username', body.username);
                user.set('password', body.password);
                user.set('email', body.email);
                list.addEntry(checkThisRecordName);
                console.log('new user has been created and added to the list');
                return res.status(200).send('200 Ok!');
            })
              }
              return;  
            })
        })
        }
      })
    })
  });
}
*/
