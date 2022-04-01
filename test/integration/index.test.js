'use strict';

const {assert} = require('chai');
const fetchFeed = require('../..');
const fs = require('fs/promises');

const tests = [
	{
		name: 'Simple ATOM feed',
		path: 'simple-atom'
	},
	{
		name: 'Simple ATOM feed (no self link)',
		path: 'simple-atom-no-self-link'
	},
	{
		name: 'Simple RSS feed',
		path: 'simple-rss'
	},
	{
		name: 'Simple RSS feed (no self link)',
		path: 'simple-rss-no-self-link'
	}
];

for (const test of tests) {
	describe(test.name, () => {
		let resolvedValue;
		let feedInfo;
		let feedEntries;
		let url;

		beforeEach(async () => {
			feedEntries = [];
			url = `${global.fixtureBaseUrl}/${test.path}/subject.xml`;
			resolvedValue = await fetchFeed({
				url,
				onInfo(info) {
					feedInfo = info;
				},
				onEntry(entry) {
					feedEntries.push(entry);
				}
			});
		});

		it('resolves with the expected data', async () => {
			const actual = JSON.parse(JSON.stringify({
				resolvedValue,
				feedInfo,
				feedEntries
			}));
			const expectedJson = await fs.readFile(`${__dirname}/fixture/${test.path}/expected.json`, 'utf-8');
			const expected = JSON.parse(expectedJson.replace(/\{\{FEED_URL\}\}/gi, url));
			assert.deepEqual(actual, expected);
		});
	});
}
