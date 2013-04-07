var app = require('../app');

exports.testsStringLength = function(beforeExit, assert) {
	assert.response(app, {
		url : '/'
	}, {
		status : 302
	}, function(res) {
		assert.ok(res);
	});
}; 