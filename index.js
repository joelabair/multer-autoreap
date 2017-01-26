var fs = require('fs'),
	  util = require('util'),
	  finished = require('on-finished'),
	  debug = require('debug')('multer-autoreap:middleware');


var defaults = {
	reapOnError: true
};

var options = Object.create(defaults);


// auto remove any uploaded files on response end
// to persist uploaded files, simply move them to a permanent location,
// or delete the req.files[key] before the response end.
module.exports = function(req, res, next) {

	var processFile = function processFile(err, file) {
		if (err && (options && !options.reapOnError)) {
			debug('skipped auto removal of %s - please manually deprecate.',  file.path);
			return;
		}
		fs.stat(file.path, function(err, stats) {
			if (!err && stats.isFile()) {
				fs.unlink(file.path, function(err) {
					if (err ) return console.warn(err);
					debug('removed %s', file.path);
					res.emit('autoreap', file);
				});
			}
		});
	};

	var reapFiles = function reapFiles(err) {
		var file, done = [];
		var mapFn = function(file) {
			processFile(err, file);
		};
		if (typeof req.files === "object") {
			for(var key in req.files) {
				if (Object.prototype.hasOwnProperty.call(req.files, key) && !~done.indexOf(key)) {
					file = req.files[key];
					if (!(file instanceof Array)) {
						file = [file];
					}
					file.forEach(mapFn);
					done.push(key);
				}
			}
		}
		if (typeof req.file === "object") {
			file = req.file;
			processFile(err, file);
		}
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
		return util._extend(options, obj);
	},
	get: function() {
		return options;
	}
});

module.exports.options = util._extend(options, defaults);
