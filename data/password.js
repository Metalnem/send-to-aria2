var username = document.getElementById('username');
var password = document.getElementById('password');

var login = document.getElementById('login');
var cancel = document.getElementById('cancel');

document.onkeydown = function(event) {
	if (event.keyCode === 13) {
		onLogin();
	} else if (event.keyCode === 27) {
		onCancel();
	}
};

login.addEventListener('click', onLogin, false);
cancel.addEventListener('click', onCancel, false);

function onLogin() {
	self.port.emit('login', {
		username: username.value,
		password: password.value
	});
}

function onCancel() {
	self.port.emit('cancel');
}
