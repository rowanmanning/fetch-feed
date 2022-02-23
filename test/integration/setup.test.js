'use strict';

const express = require('express');
const path = require('path');

before(done => {
	const app = global.app = express();
	app.use(express.static(path.join(__dirname, 'fixture')));
	global.server = app.listen(() => {
		const {port} = global.server.address();
		global.fixtureBaseUrl = `http://localhost:${port}`;
		done();
	});
});

after(done => {
	global.server.close(done);
});
