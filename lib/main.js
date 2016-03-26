let self = require('sdk/self');
let contextMenu = require('sdk/context-menu');
let notifications = require('sdk/notifications');
let panels = require('sdk/panel');
let prefs = require('sdk/simple-prefs');
let passwords = require('sdk/passwords');
let http = require('./http.js');

let menuItem = contextMenu.Item({
	contentScript: 'self.on("click", function(node) { self.postMessage(node.href); });',
	context: contextMenu.SelectorContext('a[href]'),
	label: 'Send to aria2',
	onMessage: function (url) {
		getCredentials(url).then(function (result) {
			let options = {
				url: url
			};

			if (result) {
				options.username = result.username;
				options.password = result.password;
			}

			return sendLink(options).then(function (result) {
				notifications.notify({
					title: 'Success',
					text: 'Link successfully sent to aria2.',
					iconURL: './success-64.png'
				});
			}).catch(function (error) {
				notifications.notify({
					title: 'Error',
					text: error.message,
					iconURL: './error-64.png'
				});
			});
		});
	}
});

function getCredentials(url) {
	return new Promise(function (resolve, reject) {
		passwords.search({
			url: url,
			onComplete: function (credentials) {
				resolve(credentials[0]);
			},
			onError: resolve
		});
	});
}

function sendLink(options) {
	const timeout = 10 * 1000;

	options.method = 'head';
	options.anonymous = !options.username && !options.password;
	options.timeout = timeout;

	return http.makeRequest(options).then(function (result) {
		let path = prefs.prefs['path'];
		options.secret = prefs.prefs['token'];

		if (!path) {
			throw new Error('JSON-RPC path not configured.');
		}

		return http.makeRequest({
			url: path,
			content: makeRequest(options),
			method: 'post',
			timeout: timeout
		}).catch(function (error) {
			throw new Error('Error sending link to aria2.');
		});
	}, function (error) {
		if (error.status !== 401) {
			throw new Error('Cannot access link.');
		}

		return new Promise(function (resolve, reject) {
			let panel = panels.Panel({
				contentURL: './password.html',
				contentScriptFile: './password.js',
				width: 250,
				height: 100,
				onHide: function () {
					reject(new Error('Authentication failed.'));
				}
			});

			panel.port.on('login', function (data) {
				resolve(sendLink({
					url: options.url,
					username: data.username,
					password: data.password
				}));

				panel.hide();
			});

			panel.port.on('cancel', function () {
				panel.hide();
			});

			panel.show();
		});
	});
}

function makeRequest(options) {
	let request = {
		'jsonrpc': '2.0',
		'id': Date.now(),
		'method': 'aria2.addUri',
		'params': [
			[options.url]
		]
	};

	if (options.secret) {
		request.params.splice(0, 0, 'token:' + options.secret);
	}

	if (options.username && options.password) {
		request.params.push({
			'http-user': options.username,
			'http-passwd': options.password
		});
	}

	return JSON.stringify(request);
}
