/**
 * Module dependencies.
 */

var express = require('express'), routes = require('./routes'), user = require('./routes/user'), http = require('http'), https = require('https'), path = require('path'), url = require('url'), btoa = require('btoa'), querystring = require('querystring'), app = express(), server = require('http').createServer(app), io = require('socket.io').listen(server);

// Require Mongoose module to handle mongo connection with DB
// Require schema for question model
var mongoose = require('mongoose'), question = require('./models/question'), user = require('./models/user');

// Establish connection with mongolab DB
mongoose.connect('mongodb://cloud-mreduce:cloudmr123@ds053317.mongolab.com:53317/cloud-mreduce');

// Switch socket on, emit news data

var roomList = new Array();
var userList = new Array();

io.enable('browser client minification');
// send minified client
io.enable('browser client etag');
// apply etag caching logic based on version number
io.enable('browser client gzip');
// gzip the file
io.set('log level', 1);
// reduce logging

// enable all transports (optional if you want flashsocket support, please note that some hosting
// providers do not allow you to create servers that listen on a port different than 80 or their
// default port)
io.set('transports', ['websocket', 'flashsocket', 'htmlfile', 'xhr-polling', 'jsonp-polling']);

io.sockets.on('connection', function(socket) {
	console.log("Client Connected");
	// console.log(JSON.stringify(socket));

	socket.on('connect', function(username) {
		socket.set('username', username);
		console.log(username);
		if (userList.indexOf(username) === -1) {
			userList.push(username);
		}
		io.sockets.emit('connect', userList);
		io.sockets.emit('loadRoom', roomList);
		var current_user = username;
		io.sockets.emit('currentUser', current_user);
	});

	socket.on('saveuser', function(access_token) {
		var options = {
			host : 'graph.facebook.com',
			path : '/me?fields=name,username,email,birthday&access_token=' + access_token,
			method : 'GET'
		};
		var fb_data = '';
		https.get(options, function(response) {
			console.log("Got response: " + response.statusCode);

			response.on("data", function(chunk) {
				fb_data += chunk.toString();
			});

			// Process response from graph api
			response.on("end", function() {
				var json = JSON.parse(fb_data);
				console.log(json);
				user.findOne({
					username : json.username
				}, function(err, current_user) {
					if (err) {
						console.log('error');
					}
					if (current_user !== null) {
						current_user.returning = true;
						console.log(['returning user', current_user]);
					} else {
						var new_user = new user();
						new_user.id = json.id;
						new_user.name = json.name;
						new_user.username = json.username;
						new_user.email = json.email;
						new_user.birthday = json.birthday;
						new_user.save();
						new_user.returning = false;
						console.log(['new user', new_user]);
					}
				});
			});
		}).on('error', function(e) {
			console.log("Got error: " + e.message);
		});
	});

	socket.on('disconnect', function(username) {
		userList.splice(userList.indexOf(username), 1);
		io.sockets.emit('connect', userList);
	});

	socket.on('addRoom', function(room) {
		var roomL = roomList.length;
		roomList[roomL] = room;

		io.sockets.emit('loadRoom', roomList);
	});

	socket.on('closeRoom', function(room) {
		console.log("\n\nRoom Length: " + roomList.length + "\n\n");
		var roomId = room.roomId;
		console.log('\n\nRemove Room: ' + roomId + "\n\n");
		var remove = 0;
		for (var i = 0; i < roomList.length; i++) {
			var room = roomList[i];
			if (room.roomId == roomId) {
				remove = i;
				break;
			}
		}
		roomList.splice(remove, 1);
		// console.log("\n\nRoom Length: "+roomList.length+"\n\n");
		io.sockets.emit('loadRoom', roomList);
	});

	socket.on('takeSide', function(room) {
		console.log('\ntake side\n');
		var side = '';
		if (room.pos == 'mapper') {
			side = 'reducer';
		} else if (room.pos == 'reducer') {
			side = 'mapper';
		}
		console.log(side);
		console.log('setSide' + room.roomId + side, room);
		io.sockets.emit('setSide' + room.roomId + side, room);
	});

	socket.on('connectRoom', function(room) {
		// console.log(JSON.stringify(room));
		console.log('\n\nConnect Room\n\n');
		// console.log('\n\n'+JSON.stringify(roomPlayingList)+'\n\n');
		var roomId = room.roomId;
		io.sockets.emit('enterRoom' + roomId, room);

	});

	socket.on('codeChangeMapper', function(room, code) {
		console.log('ping! codeChange' + room.roomId + 'mapper');
		socket.broadcast.emit('codeChange' + room.roomId + 'reducer', code);
	});
	socket.on('codeChangeReducer', function(room, code) {
		console.log('pong! codeChange' + room.roomId + 'reducer');
		socket.broadcast.emit('codeChange' + room.roomId + 'mapper', code);
	});

});

app.configure(function() {
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

app.configure('development', function() {
	app.use(express.errorHandler());
});

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

// API to hanlde Facebook login
app.get('/fb_login', function(req, res) {
	var _get = url.parse(req.url, true).query;
	var access_token = _get['access_token'];
	var options = {
		host : 'graph.facebook.com',
		path : '/me?fields=name,username,email,birthday&access_token=' + access_token,
		method : 'GET'
	};
	res.set('Content-Type', 'application/json');
	var fb_data = '';
	https.get(options, function(response) {
		console.log("Got response: " + response.statusCode);

		response.on("data", function(chunk) {
			fb_data += chunk.toString();
		});

		// Process response from graph api
		response.on("end", function() {
			var json = JSON.parse(fb_data);
			console.log(json);
			user.findOne({
				username : json.username
			}, function(err, current_user) {
				if (err) {
					res.jsonp('error');
				}
				if (current_user !== null) {
					current_user.returning = true;
					if (!current_user.online) {
						current_user.online = true;
					}
					current_user.save(function() {
						res.jsonp({
							type : 'returning user',
							data : current_user
						});
					});
				} else {
					if (json.error === undefined) {
						var new_user = new user();
						new_user.id = json.id;
						new_user.name = json.name;
						new_user.username = json.username;
						new_user.email = json.email;
						new_user.birthday = json.birthday;
						new_user.online = true;
						new_user.save();
						new_user.returning = false;
						res.jsonp({
							type : 'new user',
							data : new_user
						});
					} else {
						res.jsonp(json);
					}
				}
			});
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
	});

	var _get = url.parse(req.url, true).query;
	var access_token = _get['access_token'];
	var options = {
		host : 'graph.facebook.com',
		path : '/me?fields=name,username,email,birthday&access_token=' + access_token,
		method : 'GET'
	};
	res.set('Content-Type', 'application/json');
	var fb_data = '';
	https.get(options, function(response) {
		console.log("Got response: " + response.statusCode);

		response.on("data", function(chunk) {
			fb_data += chunk.toString();
		});

		// Process response from graph api
		response.on("end", function() {
			var json = JSON.parse(fb_data);
			console.log(json);
			user.findOne({
				username : json.username
			}, function(err, current_user) {
				if (err) {
					res.jsonp('error');
				}
				if (current_user !== null) {
					current_user.returning = true;
					res.jsonp(['returning user', current_user]);
				} else {
					var new_user = new user();
					new_user.id = json.id;
					new_user.name = json.name;
					new_user.username = json.username;
					new_user.email = json.email;
					new_user.birthday = json.birthday;
					new_user.save();
					new_user.returning = false;
					res.jsonp(['new user', new_user]);
				}
			});
		});
	}).on('error', function(e) {
		console.log("Got error: " + e.message);
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
				solution : solution,
				tests : (lang === 'js') ? selected_question.js_tests : selected_question.py_tests
			};
			json_data = querystring.stringify({
				jsonrequest : JSON.stringify(data)
			});
			console.log(json_data);

			var verified_results = '';
			// HTTP request options
			var options = {
				host : 'ec2-54-251-193-188.ap-southeast-1.compute.amazonaws.com',
				//path : '/' + lang + '?jsonrequest=' + btoa(JSON.stringify(data)),
				path : '/' + lang,
				method : 'POST',
				headers : {
					'Content-Type' : 'application/x-www-form-urlencoded',
					'Content-Length' : json_data.length
				}
			};

			// Call the HTTP request
			var request = http.request(options, function(response) {
				// Handle data received
				response.on('data', function(chunk) {
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
			request.write(querystring.stringify({
				jsonrequest : JSON.stringify(data)
			}));
			request.end();
		} else {
			res.jsonp("not found");
		}
	});
});

// API to retrieve total number of questions in the DB
app.get('/total_questions', function(req, res) {
	question.find({}, function(err, docs) {
		if (!err) {
			res.jsonp({
				number : docs.length
			});
		} else {
			throw err;
		}
	});
});

server.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});
