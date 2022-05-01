'use strict';

const fetchFeed = require('..');

(async () => {

	const data = {
		info: null,
		entries: []
	};

	await fetchFeed({
		// Urls
		// url: 'https://ldcomics.com/feed/',
		// url: 'https://www.nasa.gov/rss/dyn/breaking_news.rss',
		// url: 'https://rowanmanning.com/weeknotes/feed.xml',
		// url: 'http://localhost:8080/feed.xml',
		url: 'http://localhost:8080/feed-rss.xml',

		enhanceFeedData: true,

		onInfo: info => {
			data.info = {
				author: info.author,
				authors: info.authors
			};
		},
		onEntry: entry => {
			delete entry.meta;
			data.entries.push({
				title: entry.title,
				author: entry.author,
				authors: entry.authors
			});
		}
	});

	console.log(JSON.stringify(data, null, '\t'));

})();
