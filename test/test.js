var app = require('../app'), http = require('http'), request = require('supertest'), assert = require('assert');

describe('Test Express App', function() {
	it('should GET /web/index.html', function(done) {
		request(app)
			.get('/web/index.html')
			.expect(200)
			.end(function(err, res){
        		if (err) return done(err);
        		done();
      		});
	});
	
	it('should GET /web/discover.html', function(done) {
		request(app)
			.get('/web/discover.html')
			.expect(200)
			.end(function(err, res){
        		if (err) return done(err);
        		done();
      		});
	});
	
	it('should GET /web/learn.html', function(done) {
		request(app)
			.get('/web/learn.html')
			.expect(200)
			.end(function(err, res){
        		if (err) return done(err);
        		done();
      		});
	});
	
	it('should GET /web/collaborate_lobby.html', function(done) {
		request(app)
			.get('/web/collaborate_lobby.html')
			.expect(200)
			.end(function(err, res){
        		if (err) return done(err);
        		done();
      		});
	});
	
	it('should GET /web/collaborate.html', function(done) {
		request(app)
			.get('/web/collaborate.html')
			.expect(200)
			.end(function(err, res){
        		if (err) return done(err);
        		done();
      		});
	});
	
	it('should GET /web/about.html', function(done) {
		request(app)
			.get('/web/about.html')
			.expect(200)
			.end(function(err, res){
        		if (err) return done(err);
        		done();
      		});
	});
	
	it('should GET /web/contact.html', function(done) {
		request(app)
			.get('/web/contact.html')
			.expect(200)
			.end(function(err, res){
        		if (err) return done(err);
        		done();
      		});
	});
	
	it('should GET / and redirect', function(done) {
		request(app)
			.get('/')
			.expect(302)
			.end(function(err, res){
        		if (err) return done(err);
        		done();
      		});
	});
	
	it('should GET /questions', function(done) {
		request(app)
			.get('/questions')
			.expect(200)
			.end(function(err, res){
        		if (err) return done(err);
        		assert.deepEqual(res.body, 'not found');
        		done();
      		});
	});
	
	it('should GET /total_questions', function(done) {
		request(app)
			.get('/total_questions')
			.expect(200)
			.end(function(err, res){
        		if (err) return done(err);
        		done();
      		});
	});
});