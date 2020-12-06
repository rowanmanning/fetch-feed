'use strict';

const assert = require('proclaim');
const index = require('../../index');
const fetchFeed = require('../../lib/fetch-feed');

describe('index', () => {

	it('aliases `lib/fetch-feed`', () => {
		assert.strictEqual(index, fetchFeed);
	});

});
