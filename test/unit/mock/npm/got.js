'use strict';

const sinon = require('sinon');

const got = module.exports = {
	stream: sinon.stub()
};

got.mockStream = {
	on: sinon.stub(),
	pipe: sinon.stub()
};

got.stream.returns(got.mockStream);
