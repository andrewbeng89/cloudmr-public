/**
 * Module dependencies.
 */

var express = require('express')
	, routes = require('./routes')
	, user = require('./routes/user')
	, http = require('http')
	, https = require('https')
	, path = require('path')
	, connect = require('connect')
	, url = require('url')
	, querystring = require('querystring')
	, app = express();

// Require Mongoose module to handle mongo connection with DB
// Require schema for question model
var mongoose = require('mongoose'), question = require('./models/question'), user = require('./models/user');

// Establish connection with mongolab DB
mongoose.connect('mongodb://cloud-mreduce:cloudmr123@ds053317.mongolab.com:53317/cloud-mreduce');

// Arrays to store rooms (collaborative games), online users and connected socket clients
var roomList = [];
var userList = [];
var clients = [];

var cookieParser = express.cookieParser('cloud-mreduce')
	, sessionStore = new connect.middleware.session.MemoryStore();

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
	app.use(cookieParser);
	app.use(express.session({
		store : sessionStore
	}));
});

var server = require('http').createServer(app)
	, io = require('socket.io').listen(server);

var SessionSockets = require('session.socket.io')
	, sessionSockets = new SessionSockets(io, sessionStore, cookieParser);

app.configure('development', function() {
	app.use(express.errorHandler());
});

// Redirect to /public/web from root domain
app.get('/', function(req, res) {
	//req.session.username = req.session.username || 'not logged in';
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
	
	// Role param, either 'mapper' or 'reducer'
	var role = _get['role'];

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

		if (role !== undefined) {
			if (role === 'mapper') {
				solution += (selected_question.mapper_code + selected_question.combine_code);
				console.log(solution);
			} else if (role === 'reducer') {
				solution = selected_question.reducer_code + solution + selected_question.combine_code;
				console.log(solution);
			} else if (role === 'combined') {
				solution = solution + selected_question.combine_code;
			}
			
			// solution = selected_question.mapper_code + selected_question.reducer_code + selected_question.combine_code;
		}
		
		// Requested question found
		if (selected_question !== null) {
			// Prepare jsonrequest data
			var data = {
				solution : solution,
				tests : (lang === 'js') ? selected_question.js_tests : selected_question.py_tests
			};
			var json_data = querystring.stringify({
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
	// parse the URL query
	var _get = url.parse(req.url, true).query;
	// Question ID param
	var type = _get['type'];

	question.find({}, function(err, docs) {
		if (!err) {
			var collab_questions = [];
			var solo_questions = [];
			for (var i = 0; i < docs.length; i++) {
				var q = docs[i];
				if (q.question_id % 1 === 0) {
					solo_questions.push(q);
				} else {
					collab_questions.push(q);
				}
			}
			if (type !== undefined) {
				res.jsonp({
					number : (type === 'solo') ? solo_questions.length : collab_questions.length
				});
			} else {
				res.jsonp({
					number : docs.length
				});
			}
		} else {
			throw err;
		}
	});
});

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

sessionSockets.on('connection', function(err, socket, session) {
	console.log("Client Connected");

	// Listent to connect event from client
	socket.on('connect', function(username) {
		socket.set('username', username);
		console.log(username);
		
		// If the username is not in the userlist, store it
		if (userList.indexOf(username) === -1) {
			userList.push(username);
		}
		// Store client data (username, socket.id)
		clients.push({
			client_username : username,
			client_id : socket.id
		});
		console.log(clients);
		// Emit userlist and roomlist to connected clients
		io.sockets.emit('connect', userList);
		io.sockets.emit('loadRoom', roomList);
	});
	
	// Listen to saveuser event from client
	socket.on('saveuser', function(access_token) {
		// HTTP method options
		var options = {
			host : 'graph.facebook.com',
			path : '/me?fields=name,username,email,birthday&access_token=' + access_token,
			method : 'GET'
		};
		var fb_data = '';
		// Call https get from graph api
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
	
	// Listen to disconnect event from client
	socket.on('disconnect', function(data) {
		var disconnected_user;
		// Traverse client data by client_id to determine which client is disconnected
		for (var i = 0, len = clients.length; i < len; ++i) {
			var c = clients[i];
			disconnected_user = c.client_username;
			// If the client_id matches the socket_id, remove it
			if (c.client_id == socket.id) {
				clients.splice(i, 1);
				// Remove username from userlist
				userList.splice(userList.indexOf(c.client_username), 1);
				console.log('Client disconnected: ' + disconnected_user);
				console.log('users: ' + JSON.stringify(userList));
				console.log('clients: ' + JSON.stringify(clients));
				// If there are other clients with the same username, restore the username
				clients.forEach(function(element, index, array) {
					console.log('client connected: ' + JSON.stringify(element));
					if (userList.indexOf(element.client_username) == -1) {
						userList.push(element.client_username);
						console.log('users: ' + JSON.stringify(userList));
					}
				});
				// Emit userlist to connected clients
				io.sockets.emit('connect', userList);
				break;
			}
		}
	});
	
	// Listen to addroom event from client
	socket.on('addRoom', function(room) {
		roomList.push(room);
		io.sockets.emit('loadRoom', roomList);
	});
	
	// Listen to closeroom event from client
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
		io.sockets.emit('loadRoom', roomList);
	});

	// Listen to takeside event from client to determine whether a user is the mapper or reducer
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
	
	// Listen to connectroom event from client
	socket.on('connectRoom', function(room) {
		console.log('\n\nConnect Room\n\n');
		var roomId = room.roomId;
		io.sockets.emit('enterRoom' + roomId, room);
	});
	
	// Listen to code changemapper event from client
	socket.on('codeChangeMapper', function(room, code) {
		var send = {};
		send.code = code;
		send.callbackPos = 'mapper';
		console.log('ping! codeChange' + room.roomId + 'mapper');
		socket.broadcast.emit('codeChange' + room.roomId + 'reducer', send);
	});
	
	// Listen to codechangereducer event from client
	socket.on('codeChangeReducer', function(room, code) {
		var send = {};
		send.code = code;
		send.callbackPos = 'reducer';
		console.log('pong! codeChange' + room.roomId + 'reducer');
		socket.broadcast.emit('codeChange' + room.roomId + 'mapper', send);
	});


	socket.on('consoleChangeMapper', function(room, consoleText) {
		var send = {};
		send.consoleText = consoleText;
		send.callbackPos = 'mapper';
		console.log('console ping! consoleChange' + room.roomId + 'mapper');
		socket.broadcast.emit('consoleChange' + room.roomId + 'reducer', send);
	});

	socket.on('consoleChangeReducer', function(room, consoleText) {
		var send = {};
		send.consoleText = consoleText;
		send.callbackPos = 'reducer';
		console.log('console pong! consoleChange' + room.roomId + 'reducer');
		socket.broadcast.emit('consoleChange' + room.roomId + 'mapper', send);
	});

	socket.on('challengeComplete', function(room) {
		console.log('\nChallenge Completed! '+JSON.stringify(room))	;
		io.sockets.emit('challengeComplete' + room.roomId, room);
	});

});

server.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
	console.log("node.js debug log");
});

exports.testExpressServer = function(beforeExit, assert) {
	assert.response(server, {
    	url: '/web/index.html', timeout: 500
	}, {
    	status: 200
	}, function(res){
    // All done, do some more tests if needed
	});
}