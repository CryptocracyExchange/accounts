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
  
  client.record.has('user/' + body.username, function() {
    console.log('is this hit for some reason?')
    return res.status(403).send('Invalid Credentials');
  });
  //create record here
  const user = client.record.getRecord('user/' + body.username);
  console.log('user is: ', user.name);
  //run function when record is created to save the record to the mongo database
  
  //look at http authentication page again 
  //send status code
  return res.status(200).send('200 Ok!');
}).catch(function(err) {
  console.log('Promise rejected. Error is: ', err);
});
}

module.exports = {hashPassword: hashPassword};