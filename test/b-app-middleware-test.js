"use strict";

// jshint mocha:true
// jshint expr:true

const chai = require('chai');
chai.config.includeStack = true;

const expect = chai.expect;
const should = chai.should();

const supertest = require('supertest');
const express = require('express');
const multer = require('multer');
const autoReap = require('../');


// Dummy http server.
const app = express();
const os = require('os');

let lastReapedFile = {};

// parse multipart/form-data params and files wtitten to tmp dir.
const upload = multer({ dest:  os.tmpdir()});
app.use(upload.any());

// cleanup uploaded files on response end
app.use(autoReap);

const uploadHandler = function uploadHander(req, res, next) {
	let file = req.file;

	res.on('autoreap', function(reapedFile){
		lastReapedFile = reapedFile;
	});

	for(let key in req.files) {
		if (req.files.hasOwnProperty(key)) {
			file = req.files[key];
		}
	}

	if (file) {
		console.log('Recieved file: %s', file.originalname);
	}

	// we have some files ?
	if (req.files || file) {
		res.send('Ok!');
	} else {
		res.status(400).send('No file uploaded!');
	}
};

app.route('/upload-single').post(uploadHandler);
app.route('/upload-single').put(uploadHandler);

app.route('/upload').post(uploadHandler);
app.route('/upload').put(uploadHandler);

app.route('/upload').all(function(req, res, next) {
	res.status(405).send('Unsupported method!');
});


// If we get here - nothing else handled us so send a status 404.
app.use(function(req, res, next){
	res.status(404).send("Resource not found!\n" + req.url.replace(/[\?\#].*$/, ''));
});

app.use(function(err, req, res, next){
	res.status(500).send(err.message);
});


// and now for the tests
describe('Multer Autoreap (app middleware)', function() {
	let request = supertest(app);

	describe('POST /upload', function(){
		beforeEach(function() {
			lastReapedFile = {};
		});

		it('can upload a file', function(done) {
			let file = __dirname + '/unit_test.txt';

			let evalReaped = function() {
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
			let file = __dirname + '/unit_test.txt';

			let evalReaped = function() {
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

		it('supports reaping many files', function(done) {
			let file = __dirname + '/unit_test.txt';

			let evalReaped = function() {
				expect(lastReapedFile.fieldname).to.equal('file-data');
				expect(lastReapedFile.originalname).to.equal('unit_test.txt');
				done();
			};

			request
				.post('/upload')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.attach('file-data', file, 'unit_test.txt')
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
			let file = __dirname + '/unit_test.txt';

			let evalReaped = function() {
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
			let file = __dirname + '/unit_test.txt';

			let evalReaped = function() {
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
