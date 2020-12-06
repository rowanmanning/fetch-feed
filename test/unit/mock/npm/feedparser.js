'use strict';

const sinon = require('sinon');

const FeedParser = module.exports = sinon.stub();

FeedParser.mockInstance = {
	on: sinon.stub(),
	read: sinon.stub()
};

FeedParser.returns(FeedParser.mockInstance);
