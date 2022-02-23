'use strict';

const {assert} = require('chai');
const td = require('testdouble');

describe('lib/fetch-feed', () => {
	let FeedParser;
	let fetchFeed;
	let got;
	let mockFeedParserInstance;
	let mockGotStream;

	beforeEach(() => {
		FeedParser = td.replace('feedparser');
		mockFeedParserInstance = {
			on: td.func(),
			read: td.func()
		};
		td.when(new FeedParser()).thenReturn(mockFeedParserInstance);
		got = td.replace('got');
		mockGotStream = {
			on: td.func(),
			pipe: td.func()
		};
		td.when(got.stream(), {ignoreExtraArgs: true}).thenReturn(mockGotStream);
		fetchFeed = require('../../../lib/fetch-feed');
	});

	describe('fetchFeed(options)', () => {
		let options;
		let returnedPromise;

		beforeEach(() => {
			options = {
				url: 'mock-url',
				requestOptions: 'mock-request-options',
				onInfo: td.func(),
				onEntry: td.func()
			};
			returnedPromise = fetchFeed(options);
		});

		it('returns a promise', () => {
			assert.instanceOf(returnedPromise, Promise);
		});

		it('creates a feed parser', () => {
			td.verify(new FeedParser(), {times: 1});
		});

		it('listens for feed parser errors', () => {
			td.verify(
				mockFeedParserInstance.on('error', td.matchers.isA(Function)),
				{times: 1}
			);
		});

		it('listens for feed parser meta information', () => {
			td.verify(
				mockFeedParserInstance.on('meta', td.matchers.isA(Function)),
				{times: 1}
			);
		});

		it('listens for the feed parser being readable', () => {
			td.verify(
				mockFeedParserInstance.on('readable', td.matchers.isA(Function)),
				{times: 1}
			);
		});

		it('listens for the feed parser ending', () => {
			td.verify(
				mockFeedParserInstance.on('end', td.matchers.isA(Function)),
				{times: 1}
			);
		});

		it('requests the feed', () => {
			td.verify(got.stream('mock-url', 'mock-request-options'), {times: 1});
		});

		it('listens for feed request errors', () => {
			td.verify(
				mockGotStream.on('error', td.matchers.isA(Function)),
				{times: 1}
			);
		});

		it('pipes the feed request response into the feed parser', () => {
			td.verify(mockGotStream.pipe(mockFeedParserInstance), {times: 1});
		});

		describe('feed parser "error" handler', () => {
			let caughtError;
			let parserError;

			beforeEach(async () => {
				const errorHandler = td.explain(mockFeedParserInstance.on).calls
					.find(call => call.args[0] === 'error').args[1];
				try {
					parserError = new Error('parser error');
					errorHandler(parserError);
					await returnedPromise;
				} catch (error) {
					caughtError = error;
				}
			});

			it('rejects the promise with the parser error', () => {
				assert.strictEqual(caughtError, parserError);
			});

		});

		describe('feed parser "meta" handler', () => {
			let mockMeta;

			beforeEach(() => {
				const metaHandler = td.explain(mockFeedParserInstance.on).calls
					.find(call => call.args[0] === 'meta').args[1];
				mockMeta = {
					title: 'mock-meta-title',
					xmlUrl: 'mock-meta-xml-url'
				};
				metaHandler(mockMeta);
			});

			it('calls `options.onInfo` with the feed meta information', () => {
				td.verify(options.onInfo(mockMeta), {times: 1});
			});

		});

		describe('feed parser "readable" handler', () => {
			let mockEntries;

			beforeEach(() => {
				const readableHandler = td.explain(mockFeedParserInstance.on).calls
					.find(call => call.args[0] === 'readable').args[1];
				mockEntries = [
					'mock-entry-1',
					'mock-entry-2',
					'mock-entry-3'
				];
				td.when(mockFeedParserInstance.read()).thenReturn(
					mockEntries[0],
					mockEntries[1],
					mockEntries[2],
					undefined
				);
				readableHandler(mockEntries);
			});

			it('calls `options.onEntry` with each of the feed entries', () => {
				td.verify(options.onEntry(td.matchers.anything()), {times: 3});
				td.verify(options.onEntry(mockEntries[0]), {times: 1});
				td.verify(options.onEntry(mockEntries[1]), {times: 1});
				td.verify(options.onEntry(mockEntries[2]), {times: 1});
			});

		});

		describe('feed parser "end" handler', () => {
			let resolvedValue;

			beforeEach(async () => {
				const endHandler = td.explain(mockFeedParserInstance.on).calls
					.find(call => call.args[0] === 'end').args[1];
				endHandler();
				resolvedValue = await returnedPromise;
			});

			it('resolves the promise with a results object', () => {
				assert.isObject(resolvedValue);
				assert.strictEqual(resolvedValue.url, options.url);
				assert.isNull(resolvedValue.title);
				assert.strictEqual(resolvedValue.entryCount, 0);
			});

		});

		describe('feed request "error" handler', () => {
			let caughtError;
			let requestError;

			beforeEach(async () => {
				const errorHandler = td.explain(mockFeedParserInstance.on).calls
					.find(call => call.args[0] === 'error').args[1];
				try {
					requestError = new Error('request error');
					errorHandler(requestError);
					await returnedPromise;
				} catch (error) {
					caughtError = error;
				}
			});

			it('rejects the promise with the request error', () => {
				assert.strictEqual(caughtError, requestError);
			});

		});

		describe('when `options.onInfo` is not defined', () => {
			let onInfo;

			beforeEach(() => {
				mockFeedParserInstance.on = td.func();
				onInfo = options.onInfo = td.func();
				delete options.onInfo;
				returnedPromise = fetchFeed(options);
			});

			describe('feed parser "meta" handler', () => {
				let mockMeta;

				beforeEach(() => {
					const metaHandler = td.explain(mockFeedParserInstance.on).calls
						.find(call => call.args[0] === 'meta').args[1];
					mockMeta = {
						title: 'mock-meta-title',
						xmlUrl: 'mock-meta-xml-url'
					};
					metaHandler(mockMeta);
				});

				it('does not call `options.onInfo`', () => {
					td.verify(onInfo(), {
						ignoreExtraArgs: true,
						times: 0
					});
				});

			});

		});

		describe('when `options.onEntry` is not defined', () => {
			let onEntry;

			beforeEach(() => {
				mockFeedParserInstance.on = td.func();
				onEntry = options.onEntry = td.func();
				delete options.onEntry;
				returnedPromise = fetchFeed(options);
			});

			describe('feed parser "readable" handler', () => {
				let mockEntries;

				beforeEach(() => {
					const readableHandler = td.explain(mockFeedParserInstance.on).calls
						.find(call => call.args[0] === 'readable').args[1];
					mockEntries = [
						'mock-entry-1',
						'mock-entry-2',
						'mock-entry-3'
					];
					td.when(mockFeedParserInstance.read()).thenReturn(
						mockEntries[0],
						mockEntries[1],
						mockEntries[2],
						undefined
					);
					readableHandler(mockEntries);
				});

				it('does not call `options.onEntry`', () => {
					td.verify(onEntry(), {
						ignoreExtraArgs: true,
						times: 0
					});
				});

			});

		});

	});

	describe('fetchFeed(options) full flow', () => {
		let mockEntries;
		let mockMeta;
		let options;
		let resolvedValue;

		beforeEach(async () => {
			options = {
				url: 'mock-url',
				requestOptions: 'mock-request-options',
				onInfo: td.func(),
				onEntry: td.func()
			};
			td.when(options.onInfo(), {ignoreExtraArgs: true}).thenResolve(true);
			td.when(options.onEntry(), {ignoreExtraArgs: true}).thenResolve(true);
			mockMeta = {
				title: 'mock-meta-title',
				xmlUrl: 'mock-meta-xml-url'
			};
			mockEntries = [
				'mock-entry-1',
				'mock-entry-2',
				'mock-entry-3'
			];

			// Automatically resolve feed meta
			td.when(mockFeedParserInstance.on('meta'), {
				defer: true,
				ignoreExtraArgs: true
			}).thenCallback(mockMeta);

			// Automatically make the feed parser readable and resolve entries
			mockFeedParserInstance.read = td.func();
			td.when(mockFeedParserInstance.read()).thenReturn(
				mockEntries[0],
				mockEntries[1],
				mockEntries[2],
				undefined
			);
			td.when(mockFeedParserInstance.on('readable'), {defer: true}).thenCallback();

			// Automatically end the feed
			td.when(mockFeedParserInstance.on('end'), {defer: true}).thenCallback();

			resolvedValue = await fetchFeed(options);
		});

		it('resolves with a results object that includes meta and entry information', () => {
			assert.isObject(resolvedValue);
			assert.strictEqual(resolvedValue.url, mockMeta.xmlUrl);
			assert.strictEqual(resolvedValue.title, mockMeta.title);
			assert.strictEqual(resolvedValue.entryCount, mockEntries.length);
		});

		describe('when `options.onInfo` rejects with an error', () => {
			let caughtError;
			let onInfoError;

			beforeEach(async () => {
				try {
					options.onInfo = td.func();
					onInfoError = new Error('on info error');
					td.when(options.onInfo(), {
						ignoreExtraArgs: true,
						defer: true
					}).thenReject(onInfoError);
					await fetchFeed(options);
				} catch (error) {
					caughtError = error;
				}
			});

			it('rejects with the onInfo error', () => {
				assert.strictEqual(caughtError, onInfoError);
			});

		});

		describe('when `options.onEntry` rejects with an error', () => {
			let caughtError;
			let onEntryError;

			beforeEach(async () => {
				try {
					td.when(mockFeedParserInstance.read()).thenReturn(
						mockEntries[0],
						undefined
					);
					options.onEntry = td.func();
					onEntryError = new Error('on entry error');
					td.when(options.onEntry(), {
						ignoreExtraArgs: true,
						defer: true
					}).thenReject(onEntryError);
					await fetchFeed(options);
				} catch (error) {
					caughtError = error;
				}
			});

			it('rejects with the onEntry error', () => {
				assert.strictEqual(caughtError, onEntryError);
			});

		});

	});

	describe('fetchFeed()', () => {
		let caughtError;

		beforeEach(() => {
			try {
				fetchFeed();
			} catch (error) {
				caughtError = error;
			}
		});

		it('does not throw an error', () => {
			assert.isUndefined(caughtError);
		});

	});

});
