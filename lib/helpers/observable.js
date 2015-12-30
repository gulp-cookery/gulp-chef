'use strict';

function observable() {
	var listeners = [];

	listen.notify = notify;
	return listen;

	function listen(listener) {
		listeners.push(listener);
	}

	function notify(event) {
		listeners.forEach(function (listener) {
			listener(event);
		});
	}
}

module.exports = observable;
