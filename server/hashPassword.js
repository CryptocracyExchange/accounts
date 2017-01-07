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

const bcrypt = require('bcrypt');

console.log('will this run when the server starts up?');

function checkForValidLogin(user, res) {
  let recordToSearchFor = 'user/' + user.username
  console.log('are headers sent?', res.headersSent);
  res.set({
    userId: recordToSearchFor,
    username: user.username
  })
  console.log('are headers sent?', res.headersSent)
  console.log('user.username is: ', user.username);
  console.log('hits checkforValidLogin. user is: ', user);
  console.log('hits hashPasswordLogIn function');
  console.log('user.password is: ', user.password);
  //find if someone has the username in the database
  /*
  let allUsersList = client.record.getList('allUsersList').whenReady(function(list){
    let queryResultsArr = list.getEntries();
  }*/
  console.log('recordToSearchFor is: ', recordToSearchFor);
    client.record.has(recordToSearchFor, function(error, hasRecord){
      console.log('hasRecord is: ', hasRecord);
      if (error) {
        return res.status(403).send();
      } else if (!hasRecord) {
        return res.status(403).send();
      } else {
        client.record.getRecord(recordToSearchFor).whenReady(function(record){
          client.record.snapshot(record.name, function(error, data) {
            bcrypt.compare(user.password, data.password).then(function(results){
              if (results) {
                console.log('password is correct');
                // console.log('res is: ', res);
                console.log('does this log');
                res.status(200).send();
              } else {
                console.log('password is incorrect');
                res.status(403).send();
              }
            }).catch(function(err){
            console.log('Password is incorrect.', err);
            return res.status(403).send();
            })
          })
        })
    }
  })
/*
  let findUser = JSON.stringify({
    table: 'user',
    query: [
      ['username', 'eq', user.username]
    ]
  })
  console.log('time is: ', Date.now(), 'findUser is: ', findUser);
  let queryResults = client.record.getList('search?' + findUser)
  console.log('are headers sent?', res.headersSent)
  console.log('time is: ', Date.now(), 'queryResults comes before or after findUser is logged: ', queryResults);
  queryResults.whenReady(function(list) {
    console.log('are headers sent?', res.headersSent)
    console.log('time is: ', Date.now(), 'this comes before or after findUser is logged?')
    let queryResultsArr = list.getEntries();
    console.log('are headers sent?', res.headersSent)
    console.log('time is: ', Date.now(), 'queryResultsArr is: ', queryResultsArr);
    // console.log('findUser is: ', findUser);
    console.log('what Im putting in for the record name is: ', 'user/' + queryResultsArr[0]);
    client.record.getRecord('user/' + queryResultsArr[0]).whenReady(function(record){
      console.log('the record is: ', record);
      client.record.snapshot(record.name, function(error, data) {
        console.log('data of snapshot is: ', data);
        bcrypt.compare(user.password, data.password).then(function(results){
          if (results) {
            console.log('password is correct');
            // console.log('res is: ', res);
            console.log('does this log');
            res.status(200).send();
          } else {
            console.log('password is incorrect');
            res.status(403).send();
          }
      }).catch(function(err){
        console.log('Password is incorrect.', err);
        return res.status(403).end();
      })
    })
  })
})
  */
}

module.exports = checkForValidLogin;

const hashPasswordSignUp = function(body, res) {
  console.log('hits hashPasswordSignUp function');
  console.log('body.password is: ', body.password);
  bcrypt.hash(body.password, 10).then(function(results) {
    body.password = results;
    const checkThisRecordName = 'user/' + body.username;
    client.record.has(checkThisRecordName, function(error, hasRecord) {
      if (error) {
        return res.status(403).send('Invalid Credentials');
      } else if (hasRecord) {
        console.log('user already exists!');
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
          let hackyFindUserToAddSearchQuery = JSON.stringify({
            table: 'user',
            query: [
              ['user', 'eq', body.username]
            ]
          })
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
              console.log('the email has been taken')
              return res.status(403).send();
            } else {
                const user = client.record.getRecord('user/' + body.username).whenReady(function(user) {
                  user.set('username', body.username);
                  user.set('password', body.password);
                  user.set('email', body.email);
                  list.addEntry(checkThisRecordName);
                  console.log('new user has been created and added to the list');
                  return res.status(200).send();
            })
            }  
          })
      })
}
}).catch(function(err) {
    console.log('Promise rejected. Error is: ', err);
  });
})
}

module.exports = {
  hashPasswordSignUp: hashPasswordSignUp,
  checkForValidLogin: checkForValidLogin
}