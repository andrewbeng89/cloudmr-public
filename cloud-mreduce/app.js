
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

var mongoose = require('mongoose'), question = require('./models/question');
mongoose.connect('mongodb://cloud-mreduce:cloudmr123@ds053317.mongolab.com:53317/cloud-mreduce');

app.get('/', function(req, res) {
	res.redirect('/web');
});
app.get('/users', user.list);

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

app.get('/verify', function(req, res) {
	var _get = url.parse(req.url, true).query;
	var question_id = _get['q_id'];
	var lang = _get['lang'];
	if (lang === 'py') {
		lang = 'python';
	}
	var solution = _get['solution'];
	console.log(solution);
	question.findOne({
		question_id : question_id
	}, function(err, selected_question) {
		if (err) {
			res.jsonp("error");
		}
		
		// Requested question found
		if (selected_question !== null) {
			// Returns question
			var data = {
				solution:solution,
				tests: (lang === 'js') ? selected_question.js_tests : selected_question.py_tests
			};
			json_data = querystring.stringify({jsonrequest:JSON.stringify(data)});
			console.log(json_data);
			
			var verified_results = '';
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
			
			var request = http.request(options, function(response) {
    			response.on('data', function (chunk) {
        			verified_results += chunk.toString();
    			});
    			response.on("end", function() {
					res.jsonp(JSON.parse(verified_results));
					console.log(options);
				});
			}).on('error', function(e) {
				console.log("Got error: " + e.message);
			});
			request.write(querystring.stringify({jsonrequest:JSON.stringify(data)}));
			request.end();
		} else {
			res.jsonp("not found");
		}
	});
});

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

var data = [ 'jan piet klaas', 'piet klaas', 'japie' ];

function map(item, emit) {
    // the map function takes an item from the data-set
    // and can map this to a set of new items
    var splitted = item.split(/\s/g);
    for(var word in splitted) {
        // the 'emit' function is used to yield the new items
        // syntax: emit (key, value);
		emit(splitted[word], 1);
	}
}

function reduce(key, values, emit) {
    // the reduce function retrieves the emitted items
    // by key. The values that were emitted are grouped by key, and are in the 'values' array.
                                
    // the emit function is used to return the results
    // syntax: emit (value)
	emit({ key: key, count: values.length });
}

var mapreduce = function (data, map, reduce) {
	var mapResult = [], reduceResult = [];
    var mapIx, reduceKey;
       
    var mapEmit = function(key, value) {
    	if(!mapResult[key]) {
    	    mapResult[key] = [];
        }
        mapResult[key].push(value);
    }
        
    var reduceEmit = function(obj) {
    	reduceResult.push(obj);
    }
        
    for(mapIx = 0; mapIx < data.length; mapIx++) {
    	map(data[mapIx], mapEmit);
    }
        
    for(reduceKey in mapResult) {
    	reduce(reduceKey, mapResult[reduceKey], reduceEmit);
    }
    
	return reduceResult;
}

app.get('/mapreduce', function(req, res) {
	var result = mapreduce(data, map, reduce);
	for(var ix = 0; ix < result.length; ix++) {
        // we have created objects in the form { key, count }
       	// and we can write this to the screen
    	console.log(result[ix].key + ': ' + result[ix].count);
    }
    console.log(result);
    res.jsonp(result);
});

http.createServer(app).listen(app.get('port'), function(){
  console.log("Express server listening on port " + app.get('port'));
});
