let express = require('express');
let app = express();
let bodyParser = require('body-parser');

app.use(bodyParser.json());


app.get('/', function(req, res) {
  res.send('Hello World!');
});

app.post('/signup', function (req, res) {
  res.send('you hit the post request');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});