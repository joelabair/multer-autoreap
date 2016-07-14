var chai = require('chai');
chai.config.includeStack = true;

var expect = chai.expect;
var should = chai.should();

var request = require('supertest');
var express = require('express');
var multer = require('multer');
var autoReap = require('../');


// Dummy http server.
var app = express();
var os = require('os');

// parse multipart/form-data params and files wtitten to tmp dir.
var upload = multer({ dest:  os.tmpdir()});
app.use(upload.any());

// cleanup uploaded files on response end
app.use(autoReap);

var uploadHandler = function uploadHander(req, res, next) {
	var file = req.file;

	res.on('autoreap', function(reapedFile){
		lastReapedFile = reapedFile;
	});

	for(var key in req.files) {
		if (req.files.hasOwnProperty(key)) {
			file = req.files[key];
		}
	}

	if (file) {
		console.log('Recieved file: %s', file.originalname);
	}

	// we have some files ?
	if (req.files && file) {
		res.send('Ok!');
	} else {
		res.send(400, 'No file uploaded!');
	}
};


app.route('/upload-single').post(upload.single('file-data'), uploadHandler);
app.route('/upload-single').put(upload.single('file-data'), uploadHandler);

app.route('/upload').post(uploadHandler);
app.route('/upload').put(uploadHandler);

app.route('/upload').all(function(req, res, next) {
	res.send(405, 'Unsupported method!');
});


// If we get here - nothing else handled us so send a status 404.
app.use(function(req, res, next){
	res.send(404, "Resource not found!\n" + req.url.replace(/[\?\#].*$/, ''));
});

app.use(function(err, req, res, next){ res.send(500, err.message); })

// and now for the tests
describe('Multer Autoreap', function() {
	request = request(app),
	lastReapedFile = {};

	describe('POST /upload', function(){
		beforeEach(function() {
			lastReapedFile = {};
		});

		it('can upload a file', function(done) {
			var file = __dirname + '/unit_test.txt';

			var evalReaped = function() {
				expect(lastReapedFile.fieldname).to.equal('file-data');
				expect(lastReapedFile.originalname).to.equal('unit_test.txt');
				done();
			};

			request
				.post('/upload')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.expect(200)
				.end(function(err, res){
					if (err) return done(err);
					expect(res.text).to.equal('Ok!');
					setTimeout(evalReaped, 50);
				});
		});

		it('supports multer.single', function(done) {
			var file = __dirname + '/unit_test.txt';

			var evalReaped = function() {
				expect(lastReapedFile.fieldname).to.equal('file-data');
				expect(lastReapedFile.originalname).to.equal('unit_test.txt');
				done();
			};

			request
				.post('/upload-single')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.expect(200)
				.end(function(err, res){
					if (err) return done(err);
					expect(res.text).to.equal('Ok!');
					setTimeout(evalReaped, 50);
				});
		});
	});

	describe('PUT /upload', function() {
		beforeEach(function() {
			lastReapedFile = {};
		});

		it('can upload a file', function(done) {
			var file = __dirname + '/unit_test.txt';

			var evalReaped = function() {
				expect(lastReapedFile.fieldname).to.equal('file-data');
				expect(lastReapedFile.originalname).to.equal('unit_test.txt');
				done();
			};

			request
				.post('/upload')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.expect(200)
				.end(function(err, res){
					if (err) return done(err);
					expect(res.text).to.equal('Ok!');
					setTimeout(evalReaped, 50);
				});
		});

		it('supports multer.single', function(done) {
			var file = __dirname + '/unit_test.txt';

			var evalReaped = function() {
				expect(lastReapedFile.fieldname).to.equal('file-data');
				expect(lastReapedFile.originalname).to.equal('unit_test.txt');
				done();
			};

			request
				.post('/upload-single')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.expect(200)
				.end(function(err, res){
					if (err) return done(err);
					expect(res.text).to.equal('Ok!');
					setTimeout(evalReaped, 50);
				});
		});
	});

});
