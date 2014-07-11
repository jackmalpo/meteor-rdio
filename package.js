Package.describe({
  summary: "OAuth and API client for the Rdio API"
});

Package.on_use(function(api) {
  api.use('http', ['client', 'server']);
  api.use('templating', 'client');
  api.use('oauth1', ['client', 'server']);
  api.use('oauth', ['client', 'server']);
  api.use('random', 'client');
  api.use('underscore', 'server');
  api.use('service-configuration', ['client', 'server']);

  api.export('Rdio');

  api.add_files(['rdio_configure.html', 'rdio_configure.js'], 'client');

  api.add_files('rdio_server.js', 'server');
  api.add_files('rdio_client.js', 'client');
});
