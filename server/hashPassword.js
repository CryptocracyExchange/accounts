const deepstream = require('deepstream.io-client-js');
const client = deepstream('localhost:6020').login();
const bcrypt = require('bcrypt');

const hashPassword = function(body, res) {
console.log('hits hashPassword function');
console.log('body.password is: ', body.password);
bcrypt.hash(body.password, 10).then(function(results) {
  console.log('results is: ', results);
  body.password = results;
  console.log('body is: ', body);
  // res.send(body);
  //this is a server-side client & server
  //check if the record already exists
  console.log('body username is: ', body.username);
  const checkThisRecordName = 'user/' + body.username;
  console.log('checkThisRecordName is: ', checkThisRecordName);
  client.record.has(checkThisRecordName, function(error, hasRecord) {
    if (error) {
      console.log('is this hit for some reason?');
      return res.status(403).send('Invalid Credentials');
    } else if (hasRecord) {
      console.log('the record already exists!')
      return res.status(403).send('User already exists');
    } else {
      const user = client.record.getRecord('user/' + body.username).whenReady(function(user) {
        user.set('username', body.username);
        user.set('password', body.password);
        user.set('email', body.email);
        return res.status(200).send('200 Ok!');
      })
    }
  })
}).catch(function(err) {
  console.log('Promise rejected. Error is: ', err);
});
}

module.exports = {hashPassword: hashPassword};