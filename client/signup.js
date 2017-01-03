const username = document.getElementsByClassName('username')[0];
const password = document.getElementsByClassName('password')[0];
const email = document.getElementsByClassName('email')[0];
const signUpButton = document.getElementsByClassName('signUpButton')[0];

let usernameValue, passwordValue, emailValue;

username.onchange = function() {
  usernameValue = document.getElementsByClassName('username')[0].value
  console.log('usernameValue is: ', usernameValue);
}

password.onchange = function() {
  passwordValue = document.getElementsByClassName('password')[0].value
  console.log('passwordValue is: ', passwordValue);
}

email.onchange = function() {
  emailValue = document.getElementsByClassName('email')[0].value
  console.log('emailValue is: ', emailValue);
}

let data = {
    'username': 'usernameValue',
    'password': 'passwordValue',
    'email': 'emailValue'
  }

console.log(signUpButton);
signUpButton.onclick = function() {
  var username = usernameValue;
  var password = passwordValue;
  var email = emailValue;
  console.log('hits this function');
  $.ajax({
    url: '/signup',
    method: 'POST',  
    data: {
      'username': username,
      'password': password,
      'email': email
    },
  });
}