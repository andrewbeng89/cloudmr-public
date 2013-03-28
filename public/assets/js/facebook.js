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
			console.log("You are signed into FB");
			var access_token = FB.getAuthResponse()['accessToken'];
			console.log('Access Token = ' + access_token);
			FB.api('/me', function(response) {
				var server = io.connect('/');
				server.emit('connect', response.name);
				server.emit('saveuser', access_token);
				console.log('Good to see you, ' + response.name + '.');
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
}