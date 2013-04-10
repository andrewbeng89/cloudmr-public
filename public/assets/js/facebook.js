var username;
var userid;

// https://developers.facebook.com/docs/howtos/login/getting-started/
window.fbAsyncInit = function() {
	FB.init({
		appId : '281966821935203', // App ID
		channelUrl : '//http://cloud-mreduce.ap01.aws.af.cm/channel.html', // Channel File
		status : true, // check login status
		cookie : true, // enable cookies to allow the server to access the session
		xfbml : true // parse XFBML
	});

	// Additional init code here
	FB.getLoginStatus(function(response) {
		if (response.status === 'connected') {
			// socket.io server
			var server = io.connect('/');
			console.log("You are signed into FB");
			var access_token = FB.getAuthResponse()['accessToken'];
			console.log('Access Token = ' + access_token);
			FB.api('/me', function(response) {
				username = response.name;
				userid = response.id;
				console.log('username: ' + username);
				console.log('userid: ' + userid);
				//server.emit('connect', username);
				server.emit('saveuser', access_token);
				$(document).trigger('fbInit');
				updateLoginButton();
			});
			
			// connected
		} else if (response.status === 'not_authorized') {
			// not_authorized
			login();
		} else {
			login();
			// not_logged_in
		}

	});

	function postToFeed() {

        // calling the API ...
        var obj = {
          method: 'feed',
          redirect_uri: 'http://ec2-54-251-120-78.ap-southeast-1.compute.amazonaws.com/web/index.html',
          link: 'http://ec2-54-251-120-78.ap-southeast-1.compute.amazonaws.com/web/index.html',
          picture: 'http://ec2-54-251-120-78.ap-southeast-1.compute.amazonaws.com/assets/img/Single%20Player.png',
          name: 'Cloud MReduce',
          caption: 'Divide and Conquer',
          description: "Welcome to the Cloud MReduce, the one-stop learning portal for all things MapReduce! Cloud MReduce provides you an easy-to-understand MapReduce tutorial, and a platform to learn and practice various questions. Once you're familiar with MapReduce concepts, you could also teach MapReduce newbies in our real-time collaboration lobby"
        };

        function callback(response) {
          document.getElementById('msg').innerHTML = "Post ID: " + response['post_id'];
        }

        FB.ui(obj, callback);
      }
};

// Load the SDK Asynchronously
( function(d) {
		var js, id = 'facebook-jssdk', ref = d.getElementsByTagName('script')[0];
		if (d.getElementById(id)) {
			return;
		}
		js = d.createElement('script');
		js.id = id;
		js.async = true;
		js.src = "//connect.facebook.net/en_US/all.js";
		ref.parentNode.insertBefore(js, ref);
	}(document));

function login() {
	FB.login(function(response) {
		if (response.authResponse) {
			// connected
			testAPI();
			var server = io.connect('/');
			console.log("You are signed into FB");
			var access_token = FB.getAuthResponse()['accessToken'];
			console.log('Access Token = ' + access_token);
			FB.api('/me', function(response) {
				username = response.name;
				userid = response.id;
				console.log('username: ' + username);
				console.log('userid: ' + userid);
				//server.emit('connect', username);
				server.emit('saveuser', access_token);
				$(document).trigger('fbInit');
				updateLoginButton();
			});
			
		} else {
			// cancelled
		}
	});
}

function testAPI() {
	console.log('Welcome!  Fetching your information.... ');
	FB.api('/me', function(response) {
		console.log('Good to see you, ' + response.name + '.');
	});
	_gaq.push(['_trackEvent', 'user', 'login', 'new user']);
	console.log('fire new user event');
}

function updateLoginButton(){
	$('#fbsignin').text(username).attr("disabled","disabled");
}