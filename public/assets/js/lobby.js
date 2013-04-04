$(document).ready(function() {

	// Get the Facebook name and id of a user and pass to a callback function
	function get_username(cb) {
		FB.login(function(response) {
			if (response.authResponse) {
				var token = response.authResponse.accessToken;
				FB.api('/me', function(response) {
					// Invoke the callback function with the name and id params
					cb(response.name, response.id);
				});
			}
		});
	}


	jQuery.ajax({
		async : false,
		type : 'GET',
		url : '../assets/js/facebook.js',
		data : null,
		success : function(data, textStatus, jqxhr) {
			//console.log(data);
			//data returned
			console.log(textStatus);
			//success
			console.log(jqxhr.status);
			//200
			console.log('Load was performed.');
			// Contains all other functions on callback invoked (facebook name and id returned)
			$(document).on('fbInit', function() {
				get_username(lobby_callback);
			});
		},
		dataType : 'script',
		error : function(xhr, textStatus, errorThrown) {
			// Look at the `textStatus` and/or `errorThrown` properties.
		}
	});

	function lobby_callback(user_name, user_id) {
		// ----------------------------- Variables -----------------------------
		var lobbyendpoint = "/";
		var server = io.connect(lobbyendpoint);
		var username = user_name;
		var userid = user_id;
		console.log('username: ' + user_name);
		console.log('user_id: ' + user_id);

		// ----------------------------- Setup files -----------------------------
		connect();
		loadUser();
		removeUser();
		loadRoom();
		checkRoomStatus();

		// ----------------------------- Click Listeners -----------------------------

		$("#create").click(function() {
			createRoom();
		});

		$('#join').click(function() {

		});

		// ----------------------------- Methods -----------------------------
		function checkRoomStatus() {

		}

		function loadUser() {
			server.on('connect', function(userList) {

				// repopulate the whole userlist
				console.log('userlist: ' + JSON.stringify(userList));

				$('#onlineUsers tr').not(function() {
					if ($(this).has('th').length) {
						return true
					}
				}).remove();
				if (userList != null) {
					for (var i = 0; i < userList.length; i++) {
						// if (user != null) {
						if (userList[i] !== null) {
							var user = userList[i];
							$('#onlineUsers tr:last').after('<tr id=' + user + '><td>' + user + '</td></tr>');
							// }
						}
					}
				}
			});
		}

		function loadRoom() {

			server.on('loadRoom', function(roomList) {
				//currently this is only loading of the NEW room and not all rooms.
				console.log(JSON.stringify(roomList));
				// for loop to loop through the object to add it to ALL rooms
				$('#lobby tr').not(function() {
					if ($(this).has('th').length) {
						return true
					}
				}).remove();

				for (var i = 0; i < roomList.length; i++) {
					var room = roomList[i];
					addRoom(room);
				}
			});
		}

		function createRoom() {
			var form = $('#createroomForm');
			var lang = $('.control-group input[name=languageoptions]:checked').val();
			var pos = $('.control-group input[name=positionoptions]:checked').val();

			var room = {};
			room.lang = lang;
			room.pos = pos;
			room.leader = username;
			room.roomId = SHA1(username);

			server.emit('addRoom', room);
			window.location.href = "collaborate.html?room=" + SHA1(username) + "&lang=" + lang + "&pos=" + pos + "&id=1.1";

		}

		function addRoom(room) {
			// console.log('here');

			var username = room.leader;
			var pos = room.pos;
			var lang = room.lang;
			if (pos == "mapper") {
				$('#lobby tr:last').after("<tr id='" + SHA1(username) + "'><td>" + username + "</td><td></td><td>" + lang + "</td><td><a href='collaborate.html?room=" + SHA1(username) + "&lang=" + lang + "&pos=" + pos + "&id=1.1'><button class='btn btn-success' id='join'>Join</button></a></td></tr>");

			} else if (pos == "reducer") {
				$('#lobby tr:last').after("<tr id='" + SHA1(username) + "'><td></td><td>" + username + "</td><td>" + lang + "</td><td><a href='collaborate.html?room=" + SHA1(username) + "&lang=" + lang + "&pos=" + pos + "&id=1.1'><button class='btn btn-success' >Join</button></a></td></tr>");
			}
		}

		function removeRoom(roomId) {
			//i think have to transfer this to the point it the second user enters the other room.
			$('#tr' + roomId).remove();
		}

		function connect() {
			// Emit username to server
			server.emit('connect', username);
		}

		function removeUser() {
			server.on('disconnect', function() {
				$('#' + name).remove();
				console.log('disconnecting ' + username);
				server.emit('disconnect', username);
			});
		}

		// ----------------------------- Utility -----------------------------

		function updateURLParameter(url, param, paramVal) {
			var newAdditionalURL = "";
			var tempArray = url.split("?");
			var baseURL = tempArray[0];
			var additionalURL = tempArray[1];
			var temp = "";
			if (additionalURL) {
				tempArray = additionalURL.split("&");
				for ( i = 0; i < tempArray.length; i++) {
					if (tempArray[i].split('=')[0] != param) {
						newAdditionalURL += temp + tempArray[i];
						temp = "&";
					}
				}
			}

			var rows_txt = temp + "" + param + "=" + paramVal;
			return baseURL + "?" + newAdditionalURL + rows_txt;
		}

		function SHA1(msg) {
			msg = msg.toString();

			function rotate_left(n, s) {
				var t4 = (n << s) | (n >>> (32 - s));
				return t4;
			};

			function lsb_hex(val) {
				var str = "";
				var i;
				var vh;
				var vl;

				for ( i = 0; i <= 6; i += 2) {
					vh = (val >>> (i * 4 + 4)) & 0x0f;
					vl = (val >>> (i * 4)) & 0x0f;
					str += vh.toString(16) + vl.toString(16);
				}
				return str;
			};

			function cvt_hex(val) {
				var str = "";
				var i;
				var v;

				for ( i = 7; i >= 0; i--) {
					v = (val >>> (i * 4)) & 0x0f;
					str += v.toString(16);
				}
				return str;
			};

			function Utf8Encode(string) {
				string = string.replace(/\r\n/g, "\n");
				var utftext = "";

				for (var n = 0; n < string.length; n++) {

					var c = string.charCodeAt(n);

					if (c < 128) {
						utftext += String.fromCharCode(c);
					} else if ((c > 127) && (c < 2048)) {
						utftext += String.fromCharCode((c >> 6) | 192);
						utftext += String.fromCharCode((c & 63) | 128);
					} else {
						utftext += String.fromCharCode((c >> 12) | 224);
						utftext += String.fromCharCode(((c >> 6) & 63) | 128);
						utftext += String.fromCharCode((c & 63) | 128);
					}

				}

				return utftext;
			};

			var blockstart;
			var i, j;
			var W = new Array(80);
			var H0 = 0x67452301;
			var H1 = 0xEFCDAB89;
			var H2 = 0x98BADCFE;
			var H3 = 0x10325476;
			var H4 = 0xC3D2E1F0;
			var A, B, C, D, E;
			var temp;

			msg = Utf8Encode(msg);

			var msg_len = msg.length;

			var word_array = new Array();
			for ( i = 0; i < msg_len - 3; i += 4) {
				j = msg.charCodeAt(i) << 24 | msg.charCodeAt(i + 1) << 16 | msg.charCodeAt(i + 2) << 8 | msg.charCodeAt(i + 3);
				word_array.push(j);
			}

			switch (msg_len % 4) {
				case 0:
					i = 0x080000000;
					break;
				case 1:
					i = msg.charCodeAt(msg_len - 1) << 24 | 0x0800000;
					break;

				case 2:
					i = msg.charCodeAt(msg_len - 2) << 24 | msg.charCodeAt(msg_len - 1) << 16 | 0x08000;
					break;

				case 3:
					i = msg.charCodeAt(msg_len - 3) << 24 | msg.charCodeAt(msg_len - 2) << 16 | msg.charCodeAt(msg_len - 1) << 8 | 0x80;
					break;
			}

			word_array.push(i);

			while ((word_array.length % 16) != 14)
			word_array.push(0);

			word_array.push(msg_len >>> 29);
			word_array.push((msg_len << 3) & 0x0ffffffff);

			for ( blockstart = 0; blockstart < word_array.length; blockstart += 16) {

				for ( i = 0; i < 16; i++)
					W[i] = word_array[blockstart + i];
				for ( i = 16; i <= 79; i++)
					W[i] = rotate_left(W[i - 3] ^ W[i - 8] ^ W[i - 14] ^ W[i - 16], 1);

				A = H0;
				B = H1;
				C = H2;
				D = H3;
				E = H4;

				for ( i = 0; i <= 19; i++) {
					temp = (rotate_left(A, 5) + ((B & C) | (~B & D)) + E + W[i] + 0x5A827999) & 0x0ffffffff;
					E = D;
					D = C;
					C = rotate_left(B, 30);
					B = A;
					A = temp;
				}

				for ( i = 20; i <= 39; i++) {
					temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0x6ED9EBA1) & 0x0ffffffff;
					E = D;
					D = C;
					C = rotate_left(B, 30);
					B = A;
					A = temp;
				}

				for ( i = 40; i <= 59; i++) {
					temp = (rotate_left(A, 5) + ((B & C) | (B & D) | (C & D)) + E + W[i] + 0x8F1BBCDC) & 0x0ffffffff;
					E = D;
					D = C;
					C = rotate_left(B, 30);
					B = A;
					A = temp;
				}

				for ( i = 60; i <= 79; i++) {
					temp = (rotate_left(A, 5) + (B ^ C ^ D) + E + W[i] + 0xCA62C1D6) & 0x0ffffffff;
					E = D;
					D = C;
					C = rotate_left(B, 30);
					B = A;
					A = temp;
				}

				H0 = (H0 + A) & 0x0ffffffff;
				H1 = (H1 + B) & 0x0ffffffff;
				H2 = (H2 + C) & 0x0ffffffff;
				H3 = (H3 + D) & 0x0ffffffff;
				H4 = (H4 + E) & 0x0ffffffff;

			}

			var temp = cvt_hex(H0) + cvt_hex(H1) + cvt_hex(H2) + cvt_hex(H3) + cvt_hex(H4);

			return temp.toLowerCase();

		}

	}

});
