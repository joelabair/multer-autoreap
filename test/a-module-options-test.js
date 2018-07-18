"use strict";

// jshint mocha:true
// jshint expr:true

const chai = require('chai');
chai.config.includeStack = true;

const expect = chai.expect;
const should = chai.should();

// and now for the tests
describe('Multer Autoreap options', function() {

	it('exports a default options object', function() {
		const autoReap = require('../');

		expect(autoReap.options)
			.to.be.an('object')
			.that.has.property('reapOnError')
				.which.is.a('boolean')
				.that.equals(true);
	});

	it('supports option setting', function() {
		const autoReap = require('../');

		autoReap.options.reapOnError = false;

		expect(autoReap.options)
			.to.be.an('object')
			.that.has.property('reapOnError')
				.which.is.a('boolean')
				.that.equals(false);
	});

	it('supports setting arbitrary options', function() {
		const autoReap = require('../');

		autoReap.options.somebodyToLove = true;

		expect(autoReap.options)
			.to.be.an('object')
			.that.has.property('somebodyToLove')
				.which.is.a('boolean')
				.that.equals(true);
	});
});


