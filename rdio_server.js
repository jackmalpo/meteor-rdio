Rdio = function Rdio(accessToken, accessTokenSecret) {
    this.accessToken = accessToken;
    this.accessTokenSecret = accessTokenSecret;
};

// http://www.rdio.com/developers/docs/web-service/types/user/ref-web-service-type-user
Rdio.whitelistedFields = ["icon250", "firstName", "baseIcon", "gender", "url", "icon500",
                            "key", "lastName", "libraryVersion", "isProtected", "icon"];

Rdio.oauthUrls = {
    requestToken: "https://services.rdio.com/oauth2/token",
    authorize: "https://www.rdio.com/oauth2/authorize",
    accessToken: "http://api.rdio.com/oauth/access_token",
    authenticate: "https://www.rdio.com/oauth2/authorize"
};

OAuth.registerService('rdio', 1, Rdio.oauthUrls, function(oauthBinding) {

    // http://www.rdio.com/developers/docs/web-service/methods/social/ref-currentuser
    var params = { "method": "currentUser" };
    var rawResponse = oauthBinding.post('https://services.rdio.com/api/1/', params);
    var response = rawResponse.data;

    if (rawResponse.statusCode !== 200 ||
          response.status.toLowerCase() !== 'ok')
        throw new Error("Failed to complete sign up with Rdio.");

    var identity = response.result;

    var serviceData = {
        id: identity.key,
        accessToken: OAuth.sealSecret(oauthBinding.accessToken),
        accessTokenSecret: OAuth.sealSecret(oauthBinding.accessTokenSecret)
    };

    _.extend(serviceData, _.pick(identity, Rdio.whitelistedFields));

    return {
        serviceData: serviceData,
        options: {
            profile: { name: identity.firstName + " " + identity.lastName }
        }
    };
});

Rdio.retrieveCredential = function(credentialToken, credentialSecret) {
    return OAuth.retrieveCredential(credentialToken, credentialSecret);
};





Rdio.forUser = function(user) {
    var token = Rdio.credentialsForUser(user);
    if (!token) return;

    return new Rdio(token.accessToken, token.accessTokenSecret);
};

Rdio.credentialsForUser = function(user) {
    if (!user.services || !user.services.rdio) return;
    var rdio = user.services.rdio;
    if (!rdio.accessToken || !rdio.accessTokenSecret) return;
    return {
        accessToken: rdio.accessToken,
        accessTokenSecret: rdio.accessTokenSecret
    };
};

Rdio.serviceConfiguration = function() {
    if (Rdio._serviceConfigurationCache)
        return Rdio._serviceConfigurationCache;

    Rdio._serviceConfigurationCache =
        Rdio._serviceConfiguration && Rdio._serviceConfiguration.fetch()[0];
    return Rdio._serviceConfigurationCache;
};

Meteor.startup(function() {
    Meteor.autorun(function() {
        Rdio._serviceConfiguration =
            ServiceConfiguration.configurations.find( { 'service': 'rdio' } );
        Rdio._serviceConfigurationCache = null;
    });
});






Rdio.prototype = {
    constructor: Rdio,

    // Call Rdio API method with params
    // @param method                Rdio API method
    // @params Object {optional}    Parameters for method
    // @returns Object              Root data object returned by the Rdio API,
    //                              see Rdio APIs docs for details.
    // @throws RdioError
    call: function(method, params) {
        var paramsCopy = {};
        if (params) {
            for (var param in params) {
                paramsCopy[param] = params[param];
            }
        }
        paramsCopy.method = method;
        var response = this._oauthBinding().post('https://services.rdio.com/api/1/', paramsCopy);

        if (response.statusCode !== 200) throw new RdioError();
        if (response.data.status.toLowerCase() !== 'ok') throw new RdioError();

        return response.data.result;
    },

    _oauthBinding: function() {
        var config = this._config();
        var oauthBinding = new OAuth1Binding({
            consumerKey: config.consumerKey,
            secret: config.secret
        });
        oauthBinding.accessToken = this.accessToken;
        oauthBinding.accessTokenSecret = this.accessTokenSecret;
        return oauthBinding;
    },

    _config: function() {
        var config = Rdio.serviceConfiguration();
        if (!config|| !config.consumerKey || !config.secret)
            throw new ServiceConfiguration.ConfigError('rdio');

        return config;
    }
};




function RdioError(messageOrError) {
    if (typeOf(messageOrError) === "Error") {
        this.name = "RdioError (" + messageOrError.name + ")";
        this.message = messageOrError.message;
        return;
    }

    this.name = "RdioError";
    this.message = message || "Rdio API method call failed.";
}
RdioError.prototype = new Error();
RdioError.prototype.constructor = RdioError;






// HACK! The authHeader for oauth 1 signed request includes not only
// oauth headers but also any params passed in to OAuth1Binding.prototype._call
// which makes Rdio's implementation of OAuth fail.
// Not sure at the moment if params are supposed to be included in the
// Authentication header. Haven't found other OAuth meteor libraries
// using OAuthBinding1.prototype.post, passing arguments, could be a bug
// in the oauth1 Meteor package.
// TODO Check OAuth 1.0a spec: should all params to request be passed in
// the Authorization header
// Fragile Rdio targeting too. HAAACK!
OAuth1Binding.prototype._getAuthHeaderString = function(headers) {
    var self = this;
    // Only way found so far to see if it's Rdio, Rdio's API is
    // based on passing a 'method' param on any request, not protected
    // against catching other services than Rdio
    var isRdio = headers.method !== undefined;
    return 'OAuth ' +  _.compact(_.map(headers, function(val, key) {
        if (key.slice(0,6) !== 'oauth_' && isRdio) return;
        return self._encodeString(key) + '="' + self._encodeString(val) + '"';
    })).sort().join(', ');
};
