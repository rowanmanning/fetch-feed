'use strict';

const assert = require('proclaim');
const mockery = require('mockery');
const sinon = require('sinon');

describe('lib/fetch-feed', () => {
	let FeedParser;
	let fetchFeed;
	let got;

	beforeEach(() => {
		FeedParser = require('../mock/npm/feedparser');
		mockery.registerMock('feedparser', FeedParser);

		got = require('../mock/npm/got');
		mockery.registerMock('got', got);

		fetchFeed = require('../../../lib/fetch-feed');
	});

	describe('fetchFeed(options)', () => {
		let options;
		let returnedPromise;

		beforeEach(() => {
			options = {
				url: 'mock-url',
				requestOptions: 'mock-request-options',
				onInfo: sinon.stub(),
				onEntry: sinon.stub()
			};
			returnedPromise = fetchFeed(options);
		});

		it('returns a promise', () => {
			assert.isInstanceOf(returnedPromise, Promise);
		});

		it('creates a feed parser', () => {
			assert.calledOnce(FeedParser);
			assert.calledWithNew(FeedParser);
			assert.calledWithExactly(FeedParser);
		});

		it('listens for feed parser errors', () => {
			assert.calledOnce(FeedParser.mockInstance.on.withArgs('error'));
			assert.isFunction(FeedParser.mockInstance.on.withArgs('error').firstCall.args[1]);
		});

		it('listens for feed parser meta information', () => {
			assert.calledOnce(FeedParser.mockInstance.on.withArgs('meta'));
			assert.isFunction(FeedParser.mockInstance.on.withArgs('meta').firstCall.args[1]);
		});

		it('listens for the feed parser being readable', () => {
			assert.calledOnce(FeedParser.mockInstance.on.withArgs('readable'));
			assert.isFunction(FeedParser.mockInstance.on.withArgs('readable').firstCall.args[1]);
		});

		it('listens for the feed parser ending', () => {
			assert.calledOnce(FeedParser.mockInstance.on.withArgs('end'));
			assert.isFunction(FeedParser.mockInstance.on.withArgs('end').firstCall.args[1]);
		});

		it('requests the feed', () => {
			assert.calledOnce(got.stream);
			assert.calledWithExactly(got.stream, 'mock-url', 'mock-request-options');
		});

		it('listens for feed request errors', () => {
			assert.calledOnce(got.mockStream.on.withArgs('error'));
			assert.isFunction(got.mockStream.on.withArgs('error').firstCall.args[1]);
		});

		it('pipes the feed request response into the feed parser', () => {
			assert.calledOnce(got.mockStream.pipe);
			assert.calledWithExactly(got.mockStream.pipe, FeedParser.mockInstance);
		});

		describe('feed parser "error" handler', () => {
			let caughtError;
			let parserError;

			beforeEach(async () => {
				const errorHandler = FeedParser.mockInstance.on.withArgs('error').firstCall.args[1];
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
				const metaHandler = FeedParser.mockInstance.on.withArgs('meta').firstCall.args[1];
				mockMeta = {
					title: 'mock-meta-title',
					xmlUrl: 'mock-meta-xml-url'
				};
				metaHandler(mockMeta);
			});

			it('calls `options.onInfo` with the feed meta information', () => {
				assert.calledOnce(options.onInfo);
				assert.calledWithExactly(options.onInfo, mockMeta);
			});

		});

		describe('feed parser "readable" handler', () => {
			let mockEntries;

			beforeEach(() => {
				const readableHandler = FeedParser.mockInstance.on.withArgs('readable').firstCall.args[1];
				mockEntries = [
					'mock-entry-1',
					'mock-entry-2',
					'mock-entry-3'
				];
				FeedParser.mockInstance.read.onCall(0).returns(mockEntries[0]);
				FeedParser.mockInstance.read.onCall(1).returns(mockEntries[1]);
				FeedParser.mockInstance.read.onCall(2).returns(mockEntries[2]);
				FeedParser.mockInstance.read.onCall(3).returns(undefined);
				readableHandler(mockEntries);
			});

			it('calls `options.onEntry` with each of the feed entries', () => {
				assert.calledThrice(options.onEntry);
				assert.calledWithExactly(options.onEntry, mockEntries[0]);
				assert.calledWithExactly(options.onEntry, mockEntries[1]);
				assert.calledWithExactly(options.onEntry, mockEntries[2]);
			});

		});

		describe('feed parser "end" handler', () => {
			let resolvedValue;

			beforeEach(async () => {
				const endHandler = FeedParser.mockInstance.on.withArgs('end').firstCall.args[1];
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
				const errorHandler = got.mockStream.on.withArgs('error').firstCall.args[1];
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
				FeedParser.mockInstance.on.resetHistory();
				options.onInfo.resetHistory();
				onInfo = options.onInfo;
				delete options.onInfo;
				returnedPromise = fetchFeed(options);
			});

			describe('feed parser "meta" handler', () => {
				let mockMeta;

				beforeEach(() => {
					const metaHandler = FeedParser.mockInstance.on.withArgs('meta').firstCall.args[1];
					mockMeta = {
						title: 'mock-meta-title',
						xmlUrl: 'mock-meta-xml-url'
					};
					metaHandler(mockMeta);
				});

				it('does not call `options.onInfo`', () => {
					assert.notCalled(onInfo);
				});

			});

		});

		describe('when `options.onEntry` is not defined', () => {
			let onEntry;

			beforeEach(() => {
				FeedParser.mockInstance.on.resetHistory();
				options.onEntry.resetHistory();
				onEntry = options.onEntry;
				delete options.onEntry;
				returnedPromise = fetchFeed(options);
			});

			describe('feed parser "readable" handler', () => {
				let mockEntries;

				beforeEach(() => {
					const readableHandler = FeedParser.mockInstance.on.withArgs('readable').firstCall.args[1];
					mockEntries = [
						'mock-entry-1',
						'mock-entry-2',
						'mock-entry-3'
					];
					FeedParser.mockInstance.read.onCall(0).returns(mockEntries[0]);
					FeedParser.mockInstance.read.onCall(1).returns(mockEntries[1]);
					FeedParser.mockInstance.read.onCall(2).returns(mockEntries[2]);
					FeedParser.mockInstance.read.onCall(3).returns(undefined);
					readableHandler(mockEntries);
				});

				it('does not call `options.onEntry`', () => {
					assert.notCalled(onEntry);
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
				onInfo: sinon.stub().resolves(true),
				onEntry: sinon.stub().resolves(true)
			};
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
			FeedParser.mockInstance.on.withArgs('meta').yieldsAsync(mockMeta);

			// Automatically make the feed parser readable and resolve entries
			FeedParser.mockInstance.read.onCall(0).returns(mockEntries[0]);
			FeedParser.mockInstance.read.onCall(1).returns(mockEntries[1]);
			FeedParser.mockInstance.read.onCall(2).returns(mockEntries[2]);
			FeedParser.mockInstance.read.onCall(3).returns(undefined);
			FeedParser.mockInstance.on.withArgs('readable').yieldsAsync();

			// Automatically end the feed
			FeedParser.mockInstance.on.withArgs('end').yieldsAsync();

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
					FeedParser.mockInstance.on.resetHistory();
					FeedParser.mockInstance.read.resetHistory();
					options.onInfo.resetHistory();
					onInfoError = new Error('on info error');
					options.onInfo.onCall(0).rejects(onInfoError);
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
					FeedParser.mockInstance.on.resetHistory();
					FeedParser.mockInstance.read.resetHistory();
					options.onEntry.resetHistory();
					onEntryError = new Error('on entry error');
					options.onEntry.onCall(0).rejects(onEntryError);
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
