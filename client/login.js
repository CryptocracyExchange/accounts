const username = document.getElementsByClassName('username')[0];
const password = document.getElementsByClassName('password')[0];
const logInButton = document.getElementsByClassName('logInButton')[0];

username.onchange = function() {
  usernameValue = document.getElementsByClassName('username')[0].value
  console.log('usernameValue is: ', usernameValue);
}

password.onchange = function() {
  passwordValue = document.getElementsByClassName('password')[0].value
  console.log('passwordValue is: ', passwordValue);
}

let client = deepstream('localhost:6020');
logInButton.onclick = function() {
    client.login({
      role: 'user',
      username: usernameValue,
      password: passwordValue
    }, function(success, data){
      console.log('success is: ', success, 'data is: ', data);
    })
}

