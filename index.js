var fs = require('fs');
var debug = require('debug')('express:mutler-autoreap');

// auto remove any uploaded files on response end
// to persist uploaded files, simply move them to a permanent location,
// or delete the req.files[key] before the response end.
module.exports = function(req, res, next) {
	var reapFiles = function reapFiles() {
		var file;
		if (typeof req.files === "object") {
			for(var key in req.files) {
				if (req.files.hasOwnProperty(key)) {
					file = req.files[key];
					delete req.files[key]; // avoids double stats
					fs.stat(file.path, function(err, stats) {
						if (!err && stats.isFile()) {
							fs.unlink(file.path);
							debug('removed ' + file.path);
						}
					});
				}
			}
		}
	};

	res.on('finish', reapFiles);
	res.on('close', reapFiles);
	next();
};
