const path = require('path');
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const bodyParser = require('body-parser');
const expressJwt = require('express-jwt');
const AccountsProvider = require('./loginAndSignup.js');

const accounts = new AccountsProvider({
  /**
   * Only use 1 for production!
   * 0 = logging off
   * 1 = only log connection events & errors
   * 2 = also log subscriptions and discards
   * 3 = log outgoing messages
   */
  logLevel: process.env.NODE_ENV === 'prod' ? 1 : 3,
  deepstreamUrl: `${process.env.NODE_ENV === 'prod' ? 'deepstream' : 'localhost'}:6020`,
  deepstreamCredentials: process.env.NODE_ENV === 'prod' ? {
    role: process.env.DEEPSTREAM_AUTH_ROLE,
    username: process.env.DEEPSTREAM_AUTH_USERNAME,
    password: process.env.DEEPSTREAM_AUTH_PASSWORD
  } : {
    role: 'provider',
    username: 'accounts-service',
    password: '12345'
  }
});

accounts.start();

const app = express();
app.use(morgan('combined'));
app.use(cors({ origin: '*' }));
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(bodyParser.json());

app.use(express.static('client'));

// [TODO] Set this by an env var.
const jwtSecret = 'th3$3rEtc0dE!';
app.set('theSecretCode', jwtSecret);

app.get('/login', function (req,res) {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

app.post('/login', function (req, res) {
  accounts.log(`Accounts::Login Request from role ${req.body.authData.role}`);
  if (req.body.authData.role === 'user') {
    if (req.body.authData.jwt) {
      // [TODO] Implement jwt check provider method
      accounts.checkJWT(req.body.authData.jwt, res);
    } else {
      accounts.checkLogin(req.body.authData, req, res, app);
    }
  } else if (req.body.authData.role === 'provider') {
    return res.status(200).send();
  } else {
    accounts.log('Invalid login request');
    return res.status(403).send();
  }
});

app.post('/signup', function (req, res) {
  accounts.log('New signup request');
  accounts.signUp(req.body, res);
});

const port = process.env.NODE_ENV === 'prod' ? 8999 : 3001;

app.listen(port, function () {
  console.log(`Accounts service listening on port ${port}!`);
});
