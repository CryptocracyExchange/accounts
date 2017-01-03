const bcrypt = require('bcrypt');

const hashPassword = function(body, res) {
console.log('hits hashPassword function');
console.log('body.password is: ', body.password);
bcrypt.hash(body.password, 10).then(function(results) {
  console.log('results is: ', results);
  body.password = results;
  console.log('body is: ', body);
  res.send(body); 
}).catch(function(err) {
  console.log('Promise rejected. Error is: ', err);
});
}

module.exports = {hashPassword: hashPassword};