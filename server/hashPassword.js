/*
            let emailExists = emailRegExp.test(allUsersArr[i]);
            if (emailExists) {
              console.log('the email has already been used!')
              return res.status(403).send('the email has already been used');
            }
            */  

const deepstream = require('deepstream.io-client-js');

const deepstreamServer = process.env.NODE_ENV === 'prod' ? 'deepstream' : 'localhost';
const auth = process.env.NODE_ENV === 'prod' ? {
  role: process.env.DEEPSTREAM_AUTH_ROLE,
  username: process.env.DEEPSTREAM_AUTH_USERNAME,
  password: process.env.DEEPSTREAM_AUTH_PASSWORD } : {};
const client = deepstream(`${deepstreamServer}:6020`).login(auth);

const bcrypt = require('bcrypt-nodejs');

console.log('will this run when the server starts up?');

function checkLogin(results, req, res) {
  const theUsername = req.body.authData.username;
  client.record.snapshot(`user/${theUsername}`, function(error, data) {
    if (error) {
      res.status(403).send('Invalid credentials');
    } else {
      bcrypt.compare(req.body.authData.password, data.password, function(error, results) {
        if (error) {
          res.status(403).send('Password not found')
        } else {
          if (results) {
            res.status(200).send({
              clientData: {
              recordID: 'user/' + req.body.authData.username,
              username: req.body.authData.username
            },
              serverData: { role: 'user' }
            })
          } else {
            res.status(403).send('Invalid credentials');
          }
        }
      });
    }
  }, true);
}

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
            queryResults.whenReady(function(list) {
              let emailTaken = list.getEntries();
              if (emailTaken.length !== 0) {
                list.discard();
                res.status(403).send('the email has already been used');
              } else {
                list.discard();
              }
              return;  
            })
            const user = client.record.getRecord('user/' + body.username).whenReady(function(user) {
              user.set('username', body.username);
              user.set('password', body.password);
              user.set('email', body.email);
              list.addEntry(checkThisRecordName);
              console.log('new user has been created and added to the list');
              return res.status(200).send('200 Ok!');
            })
        })
        }
      })
    })
  });
}

module.exports = {
  hashPasswordSignUp: hashPasswordSignUp,
  checkLogin: checkLogin
}