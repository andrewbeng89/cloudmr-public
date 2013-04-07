var app = require('../app'), http = require('http'), request = require('supertest');

describe('WEB Folder', function() {
	it('GET /web/index.html', function(done) {
		request(app)
			.get('/web/index.html')
			.expect(200)
			.end(function(err, res){
        		if (err) return done(err);
        		done();
      		});
	});
});