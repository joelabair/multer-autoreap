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
const fs = require('fs');

// parse multipart/form-data params and files wtitten to tmp dir.
const upload = multer({ dest:  os.tmpdir()});
app.use(upload.any());

// cleanup uploaded files on response end
app.use(autoReap);

let lastReapedFile = null;

const uploadHandler = function uploadHander(req, res, next) {
	let file = null;

	res.on('autoreap', function(reapedFile){
		lastReapedFile = reapedFile;
	});

	for(let key in req.files) {
		if (req.files.hasOwnProperty(key)) {
			file = req.files[key];
			console.log('Recieved file: %s', file.originalname);
		}
	}
	res.status(500);

	res.socket.emit('error', new Error('test'));
	//throw new Error('test');
	next(new Error('test'));
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
	res.status(500).send('Error!');
});

// and now for the tests
describe('Multer Autoreap with Errors', function() {
	let request = supertest(app);

	describe('POST /upload', function(){

		beforeEach(function() {
			lastReapedFile = null;
			autoReap.options.reapOnError =  false;
		});

		it('can upload a file with an error in the response', function(done) {
			let file = __dirname + '/unit_test.txt';

			request
				.post('/upload')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.end(function(err, res) {
					expect(res).not.to.exist;
					if (err && err.message !== 'socket hang up') return done(err);
					expect(lastReapedFile).to.be.null;
					done();
				});

		});

		it('supports multer.single with an error in the response', function(done) {
			let file = __dirname + '/unit_test.txt';

			request
				.post('/upload-single')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.end(function(err, res) {
					expect(res).not.to.exist;
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
			let file = __dirname + '/unit_test.txt';

			request
				.put('/upload')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.end(function(err, res) {
					expect(res).not.to.exist;
					if (err && err.message !== 'socket hang up') return done(err);
					expect(lastReapedFile).to.be.null;
					done();
				});

		});

		it('supports multer.single with an error in the response', function(done) {
			let file = __dirname + '/unit_test.txt';

			request
				.put('/upload-single')
				.set('Accept', '*/*')
				.attach('file-data', file, 'unit_test.txt')
				.end(function(err, res) {
					expect(res).not.to.exist;
					if (err && err.message !== 'socket hang up') return done(err);
					expect(lastReapedFile).to.be.null;
					done();
				});

		});

	});

});
