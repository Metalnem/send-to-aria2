const username = document.getElementById('username');
const password = document.getElementById('password');

const login = document.getElementById('login');
const cancel = document.getElementById('cancel');

document.onkeydown = event => {
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
