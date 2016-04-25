var chai = require('chai');
chai.config.includeStack = true;

var expect = chai.expect;
var should = chai.should();

var request = require('supertest');
var express = require('express');
var multer = require('multer');

var autoReap = require('../');
autoReap.options.reapOnError =  false;

var lastReapedFile = null;

// Dummy http server.
var app = express();
var os = require('os');
var fs = require('fs');

// parse multipart/form-data params and files wtitten to tmp dir.
var upload = multer({ dest:  os.tmpdir()});
app.use(upload.any());

// cleanup uploaded files on response end
app.use(autoReap);

var uploadHandler = function uploadHander(req, res, next) {
	var file = null;

	res.on('autoreap', function(reapedFile){
		lastReapedFile = reapedFile;
	});

	for(var key in req.files) {
		if (req.files.hasOwnProperty(key)) {
			file = req.files[key];
			console.log('Recieved file: %s', file.originalname);
		}
	}

	res.socket.emit('error', new Error('test'));
	throw new Error('test');
	next(new Error('test'));
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

app.use(function(err, req, res, next){
	res.statusCode = 500
	res.send('Error!');
});

// and now for the tests
describe('Multer Autoreap with Errors', function() {
	request = request(app),
	lastReapedFile = null

	describe('POST /upload', function(){

		beforeEach(function() {
			lastReapedFile = null;
		});

		it('can upload a file with an error in the response', function(done) {
			var file = __dirname + '/unit_test.txt';

			request
				.post('/upload')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.expect(200)
				.end(function(err, res) {
					if (err && err.message !== 'socket hang up') return done(err);
					expect(lastReapedFile).to.be.null;
					done();
				});

		});
		
		it('supports multer.single with an error in the response', function(done) {
			var file = __dirname + '/unit_test.txt';

			request
				.post('/upload-single')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.expect(200)
				.end(function(err, res) {
					if (err && err.message !== 'socket hang up') return done(err);
					expect(lastReapedFile).to.be.null;
					done();
				});

		});

	});

	describe('PUT /upload', function() {

		beforeEach(function() {
			lastReapedFile = null;
		});

		it('can upload a file with an error in the response', function(done) {
			var file = __dirname + '/unit_test.txt';

			request
				.put('/upload')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.expect(200)
				.end(function(err, res){
					if (err && err.message !== 'socket hang up') return done(err);
					expect(lastReapedFile).to.be.null;
					done();
				});

		});

		it('supports multer.single with an error in the response', function(done) {
			var file = __dirname + '/unit_test.txt';

			request
				.put('/upload-single')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.expect(200)
				.end(function(err, res){
					if (err && err.message !== 'socket hang up') return done(err);
					expect(lastReapedFile).to.be.null;
					done();
				});

		});
		
	});

});
