
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path')
  , url = require('url')
  , btoa = require('btoa')
  , querystring = require('querystring')
  , app = express()
  , server = require('http').createServer(app)
  , io = require('socket.io').listen(server);
  
// Switch socket on, emit news data
io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});

app.configure(function(){
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.enable("jsonp callback");
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
  app.use(express.errorHandler());
});

// Require Mongoose module to handle mongo connection with DB
// Require schema for question model
var mongoose = require('mongoose'), question = require('./models/question');

// Establish connection with mongolab DB
mongoose.connect('mongodb://cloud-mreduce:cloudmr123@ds053317.mongolab.com:53317/cloud-mreduce');

// Redirect to /public/web from root domain
app.get('/', function(req, res) {
	res.redirect('/web');
});

// API to get the question model object from the DB based on specified question ID
app.get('/questions', function(req, res) {
	var _get = url.parse(req.url, true).query;
	var question_id = _get['id'];
	question.findOne({
		question_id : question_id
	}, function(err, selected_question) {
		if (err) {
			res.jsonp("error");
		}
		
		// Requested question found
		if (selected_question !== null) {
			// Returns question
			res.jsonp(selected_question);
		} else {
			res.jsonp("not found");
		}
	});
});

// Code verification API using GET method
app.get('/verify', function(req, res) {
	// parse the URL query
	var _get = url.parse(req.url, true).query;
	
	// Question ID param
	var question_id = _get['q_id'];
	
	// Language param, either 'py' or 'js'
	var lang = _get['lang'];
	if (lang === 'py') {
		lang = 'python';
	}
	
	// Solution param, urlEncoded
	var solution = _get['solution'];
	console.log(solution);
	
	// Find the question model object based on question ID
	question.findOne({
		question_id : question_id
	}, function(err, selected_question) {
		if (err) {
			res.jsonp("error");
		}
		
		// Requested question found
		if (selected_question !== null) {
			// Prepare jsonrequest data
			var data = {
				solution:solution,
				tests: (lang === 'js') ? selected_question.js_tests : selected_question.py_tests
			};
			json_data = querystring.stringify({jsonrequest:JSON.stringify(data)});
			console.log(json_data);
			
			var verified_results = '';
			// HTTP request options
			var options = {
				host : 'ec2-54-251-193-188.ap-southeast-1.compute.amazonaws.com',
				//path : '/' + lang + '?jsonrequest=' + btoa(JSON.stringify(data)),
				path : '/' + lang,
				method : 'POST',
				headers: {
        			'Content-Type': 'application/x-www-form-urlencoded',
        			'Content-Length': json_data.length
    			}
			};
			
			// Call the HTTP request
			var request = http.request(options, function(response) {
    			// Handle data received
    			response.on('data', function (chunk) {
        			verified_results += chunk.toString();
    			});
    			// Send the json response
    			response.on("end", function() {
					res.jsonp(JSON.parse(verified_results));
					console.log(options);
				});
			}).on('error', function(e) {
				console.log("Got error: " + e.message);
			});
			
			// Write jsonrequest data to the HTTP request
			request.write(querystring.stringify({jsonrequest:JSON.stringify(data)}));
			request.end();
		} else {
			res.jsonp("not found");
		}
	});
});

// API to retrieve total number of questions in the DB
app.get('/total_questions', function(req, res) {
	question.find(
        {},
        function(err, docs) {
        	if (!err){ 
            	res.jsonp({number:docs.length});
            } else {
				throw err;
			}
		}
    );
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});