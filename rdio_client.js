Rdio = {};

// Request Rdio credentials for the user
// @param options {optional}  No 'options' for Rdio at the moment, keeping
//   'options' for API consitency with most meteor Auth libraries.
// @param credentialRequestCompleteCallback {Function} On completion callback
//   Takes one argument, credentialToken on success, or Error on error.
Rdio.requestCredential = function (options, credentialRequestCompleteCallback) {
    // support both (options, callback) and (callback).
    if (!credentialRequestCompleteCallback && typeof options === 'function') {
        credentialRequestCompleteCallback = options;
        options = {};
    }

    var config = ServiceConfiguration.configurations.findOne({service: 'rdio'});
    if (!config) {
        var conf = new ServiceConfiguration.ConfigError();
        if (credentialRequestCompleteCallback)
            credentialRequestCompleteCallback(conf);
        return;
    }

    var credentialToken = Random.secret();
    // url to app, enters "step 1" as described in
    // packages/accounts-oauth1-helper/oauth1_server.js
    var loginUrl = '/_oauth/rdio/?requestTokenAndRedirect=true' +
        '&state=' + credentialToken;

    OAuth.showPopup(
        loginUrl,
        _.bind(credentialRequestCompleteCallback, null, credentialToken)
    );
};
