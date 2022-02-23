'use strict';

const {assert} = require('chai');
const fetchFeed = require('../..');

const tests = [
	{
		name: 'Simple ATOM feed',
		path: 'simple-atom'
	},
	{
		name: 'Simple RSS feed',
		path: 'simple-rss'
	}
];

for (const test of tests) {
	describe(test.name, () => {
		let resolvedValue;
		let feedInfo;
		let feedEntries;

		beforeEach(async () => {
			feedEntries = [];
			resolvedValue = await fetchFeed({
				url: `${global.fixtureBaseUrl}/${test.path}/subject.xml`,
				onInfo(info) {
					feedInfo = info;
				},
				onEntry(entry) {
					feedEntries.push(entry);
				}
			});
		});

		it('resolves with the expected data', () => {
			const actual = JSON.parse(JSON.stringify({
				resolvedValue,
				feedInfo,
				feedEntries
			}));
			const expected = require(`./fixture/${test.path}/expected.json`);
			assert.deepEqual(actual, expected);
		});
	});
}
