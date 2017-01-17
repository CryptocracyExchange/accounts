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

const jwtSecret = 'th3$3rEtc0dE!';
app.set('theSecretCode', jwtSecret);

app.get('/login', function (req,res) {
  res.sendFile(path.join(__dirname, '../client/login.html'));
});

app.post('/login', function (req, res) {
  console.log('Accounts::Login Request');
  console.log('req.body.authData.role is: ', req.body.authData.role);
  if (req.body.authData.role === 'user') {
    console.log('a user is trying to login');
    accounts.checkLogin(req.body.authData, req, res, app);
  } else if (req.body.authData.role === 'provider') {
    console.log('a provider is trying to login');
    return res.status(200).end();
  } else {
    console.log('invalid request');
    return res.status(403).end();
  }
});

app.post('/signup', function (req, res) {
  console.log('a post request happened');
  console.log('req body is: ', req.body);
  accounts.signUp(req.body, res);
  // res.send('you hit the post request');
});

const port = process.env.NODE_ENV === 'prod' ? 8999 : 3001;

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});
