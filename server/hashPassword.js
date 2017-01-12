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

function checkLogin(results, req, res){
    let theUsername = req.body.authData.username
      const findUser = JSON.stringify({
        table: 'user',
        query: [
          ['username', 'eq', theUsername]
        ]
      })
      // console.log('findUser is: ', findUser);
      const findUserResults = client.record.getList('search?' + findUser);
      // console.log('findUserResults is: ', findUserResults);
      findUserResults.whenReady( (findUserResults) => {
        let findUserResultsEntries = findUserResults.getEntries();
        console.log('findUserResultsEntries', findUserResultsEntries);
        // findUserResultsEntries[0]
        client.record.getRecord('user/' + 'b6').whenReady(function(record){
          client.record.snapshot(record.name, function(error, data) {
            console.log('data of snapshot is: ', data);
            console.log('req.body.authData.password is: ', req.body.authData.password, 'data.password is: ', data.password);
            bcrypt.compare(req.body.authData.password, data.password, function(results){
              findUserResults.delete();
              if (results) {
                console.log('hits results is truthy')
                console.log('are headers sent?', res.headersSent)
                authenticate = true;
                res.status(200).send({
                  username: req.body.authData.username,
                  clientData: { 
                    userID: 'user/' + req.body.authData.username,
                    username: req.body.authData.username
                  },
                  serverData: { role: 'user' }
                })
                console.log('does anything happen now?')
              } else {
                res.status(403).send('Invalid credentials');
              }
            })
          })
        })
        })
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
                return res.status(403).send('the email has already been used');
              }  
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