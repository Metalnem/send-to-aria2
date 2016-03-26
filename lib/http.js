const { XMLHttpRequest } = require("sdk/net/xhr");

function XhrError(message, status) {
	this.name = 'XhrError';
	this.message = message;
	this.status = status;
}

XhrError.prototype = Error.prototype;

function makeRequest(options) {
	return new Promise(function(resolve, reject) {
		var request = new XMLHttpRequest({
			mozAnon: options.anonymous
		});

		var method = options.method || 'get';
		request.open(method, options.url, true, options.username, options.password);

		request.responseType = options.responseType || '';
		request.timeout = options.timeout || 0;

		request.onload = function() {
			if (request.status === 200) {
				resolve(request.response);
			} else {
				reject(new XhrError(request.statusText, request.status));
			}
		};

		request.onerror = function() {
			reject(new XhrError('A network error has occurred.'));
		};

		request.ontimeout = function() {
			reject(new XhrError('Request timed out.'));
		};

		request.send(options.content);
	});
}

exports.makeRequest = makeRequest;