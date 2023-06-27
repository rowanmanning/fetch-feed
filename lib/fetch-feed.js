'use strict';

const FeedParser = require('feedparser');
const got = require('got').default;

const defaultOptions = {
	url: '',
	requestOptions: {}
};

/**
 * Fetch and parse an RSS or Atom feed.
 *
 * @public
 * @param {object} options
 *     feed fetching options.
 * @param {string} options.url
 *     The URL of an RSS or Atom feed.
 * @param {object} [options.requestOptions]
 *     Options to customise the request that fetches the feed.
 *     See {@link https://github.com/sindresorhus/got#options}.
 * @param {FeedInfoCallback} [options.onInfo]
 *     A function which is called with feed information once it's available.
 * @param {FeedEntryCallback} [options.onEntry]
 *     A function which is called with feed information once it's available.
 * @returns {Promise<FetchFeedResult>}
 *     Returns feed fetch results.
 */
function fetchFeed({url, requestOptions, onInfo, onEntry} = defaultOptions) {
	return new Promise((resolve, reject) => {

		// A place to store promises created by the
		// info and entry handlers
		const feedProcessingPromises = [];

		// The object to eventually resolve with, used to
		// keep a tally of entries and store some basic
		// feed info
		const result = {
			url,
			title: null,
			entryCount: 0
		};

		// Create a feed parser
		const feedParser = new FeedParser({});
		feedParser.on('error', reject);

		// Handle feed meta info
		feedParser.on('meta', meta => {
			result.title = meta.title;
			if (meta.xmlUrl) {
				result.url = meta.xmlUrl;
			} else {
				meta.xmlUrl = meta.xmlurl = result.url;
			}
			if (onInfo) {
				feedProcessingPromises.push(onInfo(meta));
			}
		});

		// Handle feed entries
		feedParser.on('readable', () => {
			let entry;
			while (entry = feedParser.read()) {
				if (onEntry) {
					feedProcessingPromises.push(onEntry(entry));
				}
				result.entryCount += 1;
			}
		});

		// Handle the feed stream ending
		feedParser.on('end', async () => {
			try {

				// Await all of the promises, this catches any errors immediately
				// but later promises continue to be resolved
				await Promise.all(feedProcessingPromises);

				// Everything resolved
				resolve(result);

			} catch (error) {

				// We still only want to reject after all of the promises have been resolved.
				// Now that we've caught the error we can wait for all promises to be settled
				// before we reject
				await Promise.allSettled(feedProcessingPromises);

				// Reject with the original error
				reject(error);

			}
		});

		// Request the XML and stream the response into the feed parser
		const xmlStream = got.stream(url, requestOptions);
		xmlStream.on('error', reject);
		xmlStream.on('response', response => {
			result.url = response.url;
			xmlStream.off('error', reject);
			xmlStream.pipe(feedParser);
		});
	});
}

module.exports = fetchFeed;
module.exports.default = module.exports;

/**
 * A callback function which handles feed information.
 *
 * @callback FeedInfoCallback
 * @param {import('feedparser').Meta} feedInfo
 *     Feed information defined by node-feedparser.
 *     See {@link https://github.com/danmactough/node-feedparser#list-of-meta-properties}.
 * @returns {Promise<undefined> | undefined}
 *     Returns a promise or undefined.
 */

/**
 * A callback function which handles a feed entry.
 *
 * @callback FeedEntryCallback
 * @param {import('feedparser').Item} feedEntry
 *     Feed entry information defined by node-feedparser.
 *     See {@link https://github.com/danmactough/node-feedparser#list-of-article-properties}.
 * @returns {Promise<undefined> | undefined}
 *     Returns a promise or undefined.
 */

/**
 * The result of fetching a feed.
 *
 * @typedef {object} FetchFeedResult
 * @property {string | null} url
 *     The final URL of the feed, taken from the feed XML.
 * @property {string | null} title
 *     The title of the feed, taken from the feed XML.
 * @property {number} entryCount
 *     The number of entries that were parsed out of the feed.
 */
