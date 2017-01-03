let express = require('express');
let app = express();
let morgan = require('morgan');
let bodyParser = require('body-parser');
let hashPassword = require('./hashPassword.js').hashPassword;
// console.log('hashPassword is: ', hashPassword);

app.use(morgan('combined'));

app.use(bodyParser.urlencoded({
  extended: true
})); //Now getting this message. body-parser deprecated undefined extended: provide extended option server/index.js:6:20. (Revise this?)
app.use(bodyParser.json());


app.use(express.static('client'));

app.post('/signup', function (req, res) {
  console.log('a post request happened');
  console.log('req body is: ', req.body);
  hashPassword(req.body, res);
  // res.send('you hit the post request');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});