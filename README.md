
# Fetch Feed

Fetch and parse RSS and Atom feeds. Fetch Feed is a Promise-based wrapper around [node-feedparser](https://github.com/danmactough/node-feedparser).


## Table of Contents

  * [Requirements](#requirements)
  * [Usage](#usage)
  * [Example](#example)
  * [Config options](#config-options)
  * [Contributing](#contributing)
  * [License](#license)


## Requirements

This library requires the following to run:

  * [Node.js](https://nodejs.org/) v16+


## Usage

Install with [npm](https://www.npmjs.com/):

```sh
npm install @rowanmanning/fetch-feed
```

Load the library into your code with a `require` call:

```js
const fetchFeed = require('@rowanmanning/fetch-feed');
```

Now you can call `fetchFeed` with [various options](#config-options) to fetch and parse RSS and Atom feeds:

```js
const result = await fetchFeed({
    url: 'https://rowanmanning.com/posts/feed.xml'
});
```

### Handling feeds

The [node-feedparser](https://github.com/danmactough/node-feedparser) library is stream-based, loading as little of a feed into memory as possible. This allows it to handle potentially very large feeds. Because of this, `fetchFeed` does not resolve with the entire parsed feed – you must handle the parsed feed entries separately.

You do this with the `onInfo` and `onEntry` options, which are functions:

```js
const result = await fetchFeed({
    url: 'https://rowanmanning.com/posts/feed.xml',

    // Called once
    onInfo: async info => {
        // Do something with the feed meta information
    },

    // Called for each entry found
    onEntry: async entry => {
        // Do something with the feed entry
    }
});
```

The [feed info](https://github.com/danmactough/node-feedparser#list-of-meta-properties) and [feed entry](https://github.com/danmactough/node-feedparser#list-of-article-properties) objects are documented by node-feedparser.

If these handlers return promises, then you can be sure that your code will execute in the order:

  1. The feed XML is requested
  2. In any order, `onInfo` and `onEntry` will be called with the relevant data
  3. The outer `fetchFeed` promise will resolve or reject


### Resolved value

To make sure that we never store the full parsed feed in memory, the resolved value from `fetchFeed` is a simple object with just a few feed details:

```js
{
    url: String,        // The final URL of the feed (after redirects)
    title: String,      // The title of the feed
    entryCount: Number  // The number of entries that were parsed
}
```

### Rejections

If any of the following happen, the outer `fetchFeed` promise will reject with an error:

  1. The request to fetch the feed fails in some way (e.g. an HTTP error)
  2. The parsing of the feed fails (e.g. malformed XML)
  3. The `onInfo` handler function rejects
  4. The `onEntry` handler function rejects

It's important to note that this doesn't cancel any of the actions that occurred in handlers before the rejection, and errors in a single handled entry do not stop others from being handled correctly.


## Example

This full example fetches a feed, logs information about it, and handles errors:

```js
try {
    const result = await fetchFeed({

        // Feed URL and request details
        url: 'https://rowanmanning.com/posts/feed.xml',
        requestOptions: {
            headers: {
                'User-Agent': 'Fetch Feed Example'
            }
        },

        // Info handler
        onInfo: async info => {
            console.log(`Parsed feed meta information: ${info.title}`);
        },

        // Entry handler
        onEntry: async entry => {
            console.log(`Parsed feed entry: ${entry.title}`);
        }

    });
    console.log(`Finished fetching ${result.url}. Found ${result.entryCount} entries`);
} catch (error) {
    console.error(`Feed fetching failed: ${error.message}`);
}
```


## Config options

Fetch Feed is configured using options passed into the main `fetchFeed` function:

  - **`url`:** `String`. A full valid URL to an RSS or Atom feed. Required.

  - **`requestOptions`:** `Object`. Config options for the HTTP request that fetches the feed. This is passed directly into [Got](https://github.com/sindresorhus/got), see [Got's options documentation](https://github.com/sindresorhus/got#options) for more information. Defaults to `undefined` (uses the default request options).

  - **`onInfo`:** `Function<Promise>`. A function that is given meta information about the feed. This function will only be called once with a single `Object` argument – the feed information. `onInfo` must return a Promise. Defaults to `undefined` (feed information is not captured).

  - **`onEntry`:** `Function<Promise>`. A function that is given information about each entry in the feed. This function will be called for each entry found in the feed, with a single `Object` argument – the entry information. `onEntry` must return a Promise. Defaults to `undefined` (entry information is not captured).


## Contributing

[The contributing guide is available here](docs/contributing.md). All contributors must follow [this library's code of conduct](docs/code_of_conduct.md).


## License

Licensed under the [MIT](LICENSE) license.<br/>
Copyright &copy; 2020, Rowan Manning.
