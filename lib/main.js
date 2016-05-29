const contextMenu = require('sdk/context-menu');
const notifications = require('sdk/notifications');
const panels = require('sdk/panel');
const prefs = require('sdk/simple-prefs');
const passwords = require('sdk/passwords');
const http = require('./http.js');
const timeout = 10 * 1000;

contextMenu.Item({
	contentScript: 'self.on("click", function(node) { self.postMessage(node.href); });',
	context: contextMenu.SelectorContext('a[href]'),
	label: 'Send to aria2',
	onMessage: onSendLink
});

function onSendLink(url) {
	return getCredentials(url)
		.then(credentials => sendLink(url, credentials.username, credentials.password))
		.then(onSuccess)
		.catch(onError);
}

function onSuccess() {
	notifications.notify({
		title: 'Success',
		text: 'Link successfully sent to aria2.',
		iconURL: './success-64.png'
	});
}

function onError(error) {
	notifications.notify({
		title: 'Error',
		text: error.message,
		iconURL: './error-64.png'
	});
}

function getCredentials(url) {
	if (url.startsWith('magnet:?')) {
		return Promise.resolve({});
	} else {
		return getSavedCredentials(url).then(credentials => getFinalCredentials(url, credentials.username, credentials.password));
	}
}

function getSavedCredentials(url) {
	return new Promise(resolve => {
		passwords.search({
			url: url,
			onComplete: credentials => resolve(credentials[0] || {}),
			onError: () => resolve({})
		});
	});
}

function getFinalCredentials(url, username, password) {
	const options = {
		url: url,
		username: username,
		password: password,
		method: 'head',
		anonymous: !username && !password,
		timeout: timeout
	};

	return http.makeRequest(options).then(() => ({
		username: username,
		password: password
	}), error => {
		if (error.status !== 401) {
			throw new Error('Cannot access link.');
		}

		return new Promise((resolve, reject) => {
			const panel = panels.Panel({
				contentURL: './password.html',
				contentScriptFile: './password.js',
				width: 250,
				height: 100,
				onHide: () => reject(new Error('Authentication failed.'))
			});

			panel.port.on('login', data => {
				resolve(getFinalCredentials(url, data.username, data.password));
				panel.hide();
			});

			panel.port.on('cancel', () => panel.hide());
			panel.show();
		});
	});
}

function sendLink(url, username, password) {
	const path = prefs.prefs['path'];
	const token = prefs.prefs['token'];

	if (!path) {
		throw new Error('JSON-RPC path not configured.');
	}

	return http.makeRequest({
		url: path,
		content: makeJob(url, token, username, password),
		method: 'post',
		timeout: timeout
	}).catch(() => {
		throw new Error('Error sending link to aria2.');
	});
}

function makeJob(url, token, username, password) {
	const job = {
		'jsonrpc': '2.0',
		'id': Date.now(),
		'method': 'aria2.addUri',
		'params': [
			[url]
		]
	};

	if (token) {
		job.params.splice(0, 0, 'token:' + token);
	}

	if (username && password) {
		job.params.push({
			'http-user': username,
			'http-passwd': password
		});
	}

	return JSON.stringify(job);
}
