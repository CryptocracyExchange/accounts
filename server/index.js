let path = require('path');
let express = require('express');
let app = express();
let morgan = require('morgan');
let bodyParser = require('body-parser');
let signUpOrLogIn = require('./hashPassword.js');
// console.log('hashPassword is: ', hashPassword);
console.log('signUpOrLogIn is: ', signUpOrLogIn);

app.use(morgan('combined'));

app.use(bodyParser.urlencoded({
  extended: true
})); //Now getting this message. body-parser deprecated undefined extended: provide extended option server/index.js:6:20. (Revise this?)
app.use(bodyParser.json());


app.use(express.static('client'));

app.get('/login', function (req,res) {
  res.sendFile(path.join(__dirname, '../client/login.html'));
})

app.post('/login', function (req, res) {
  console.log('if I see this then a post request was made to login');
  console.log('req.body.authData.role is: ', req.body.authData.role);
  if (req.body.authData.role === 'user') {
    console.log('a user is trying to login');
    signUpOrLogIn.checkLogin(req.body.authData, req, res);
  } else if (req.body.authData.role === 'provider') {
    console.log('a provider is trying to login');
    return res.status(200).end();
  } else {
    console.log('invalid request')
    return res.status(403).end();
  }
})

app.post('/signup', function (req, res) {
  console.log('a post request happened');
  console.log('req body is: ', req.body);
  signUpOrLogIn.hashPasswordSignUp(req.body, res);
  // res.send('you hit the post request');
});

const port = process.env.NODE_ENV === 'prod' ? 8999 : 3001;

app.listen(port, function () {
  console.log(`Example app listening on port ${port}!`);
});
