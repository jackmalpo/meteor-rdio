meteor-rdio
===========

OAuth (1.0a) and API [Meteor](https://www.meteor.com/) package for the Rdio API. On [atmospherejs](https://www.atmospherejs.com/).

This is the backbone of `accounts-rdio` and a thin client
around the Rdio API, similar to node-rdio or rdio-simple,
but using Meteor's OAuth library.

Installation
------------

* `mrt add rdio`

Usage
-----

	// Client

	// Client side requestCredential() function modeled on core auth libs.
	// Usually called by the wrapper Meteor.loginWithRdio() which
	// is be found in the 'accounts-rdio' package.
	Rdio.requestCredential({}, function(credentialTokenOrErr) { ... });

	// Server

	// Create an rdio api client instance passing 'accessToken' and
	// 'accessTokenSecret' directly.
	// 'consumerKey' and 'secret' are pulled from rdio config.
	var rdio = new Rdio("accessToken", "accessTokenSecret");
	var tracks = rdio.call('get', {'keys': 'a254895,a104386'});

	// Get Rdio accessTokens from Meteor.users instance.
	var rdio = Rdio.forUser(user);
	var currentUser = rdio.call('currentUser');

	// Not sure opening all Rdio's API to the client is the right
	// way to go, but it gives a good example usage.
	Meteor.methods({
	    rdioCall: function(method, params) {
	        var user = Meteor.user();
	        if (!user) return "No user";

	        var rdio = Rdio.forUser(user);
	        if (!rdio) return "No Rdio creadentials";
	        return rdio.call(method, params);
	    }
	});



Warning
-------

Unresolved issue: OAuth1Binding.prototype._getAuthHeaderString (of
the meteor package) is monkey patched as it seems to produce an output
incompatible with Rdio's implementation and/or usage of OAuth. It should
not affect most other auth packages, as none that could be found at the
moment seem to pass params to OAuth1Binding.prototype._call()

