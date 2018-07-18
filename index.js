const fs = require('fs');
const finished = require('on-finished');
const debug = require('debug')('multer-autoreap:middleware');

require('es6-object-assign/auto');

const defaults = {
	reapOnError: true
};

let options = Object.assign({}, defaults);

// auto remove any uploaded files on response end
// to persist uploaded files, simply move them to a permanent location,
// or delete the req.files[key] before the response end.
module.exports = function(req, res, next) {

	const processFile = function processFile(err, file) {
		if (err && (options && !options.reapOnError)) {
			debug('skipped auto removal of %s - please manually deprecate.',  file.path);
			return;
		}
		fs.stat(file.path, (err, stats) => {
			if (!err && stats.isFile()) {
				fs.unlink(file.path, err => {
					if (err ) return console.warn(err);
					debug('removed %s', file.path);
					res.emit('autoreap', file);
				});
			}
		});
	};

	const reapFiles = function reapFiles(err) {
		let done = [];
		let queue = [];

		if (req.file) {
			queue = queue.concat(req.file);
			debug('queued %s', req.file);
		}

		if (req.files) {
			if (Array.isArray(req.files)) {
				queue = queue.concat(req.files);
				debug('queued %O', req.files);
			} else {
				Object.entries(req.files).forEach(([key, files]) => {
					queue = queue.concat(files);
					debug('queued %s, %O', key, files);
				});
			}
		}

		queue.forEach(file => {
			if (!done.includes(file)) {
				processFile(err, file);
				done.push(file);
			}
		});
	};

 	finished(res, reapFiles);
	next();
};


Object.defineProperty(module.exports, 'options', {
	enumerable: true,
	set: function(obj) {
		obj = new Object(obj);
		if (obj instanceof Array) {
			return options;
		}
		return Object.assign({}, defaults, obj);
	},
	get: function() {
		return options;
	}
});

module.exports.options = options;
