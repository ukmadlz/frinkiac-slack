'use strict';

require('dotenv').load({ silent: true });
var Hapi       = require('hapi');
var Path       = require('path');
var Path       = require('path');
var dateFormat = require('dateformat');
var request    = require('request');

// Fixed formats
var format = 'd mmm HH:MM:ss';

// Instantiate the server
var server = new Hapi.Server({
  debug: {
    request: ['error', 'good'],
  },
  connections: {
    routes: {
      files: {
        relativeTo: Path.join(__dirname, 'public'),
      },
    },
  },
});

// Set Hapi Connections
server.connection({
  host: process.env.VCAP_APP_HOST || process.env.HOST || 'localhost',
  port: process.env.VCAP_APP_PORT || process.env.PORT || 3000,
});

// Hapi Log
server.log(['error', 'database', 'read']);

// And Do _ALL_ the work
server.route({
  method: 'GET',
  path: '/command',
  handler: (req, reply) => {
    var quote = req.query.text;
    request({
      url: 'https://frinkiac.com/api/search',
      json: true,
      qs: {
        q: quote,
      },
    }, function(error, response, body) {
        if (error) console.log(error);
        var random = Math.floor(Math.random() * body.length);
        request({
          url: 'https://frinkiac.com/api/caption',
          json: true,
          qs: {
            e: body[random].Episode,
            t: body[random].Timestamp,
          },
        }, function(error, response, body) {
          if (error) console.log(error);
          var lines = [];
          for (var i = 0; i < body.Subtitles.length; i++) {
            lines.push(body.Subtitles[i].Content.replace(/\ /g, '+'));
          }

          var image = 'https://frinkiac.com/meme/' +
          body.Frame.Episode +
          '/' +
          body.Frame.Timestamp +
          '.jpg?lines=' +
          lines.join('%0A');
          reply({
            response_type: 'in_channel',
            text: image,
          }).code(200);
        });
      });
  },
});

// Start Hapi
server.start(function(err) {
  if (err) {
    console.log(err);
  } else {
    console.log(dateFormat(new Date(), format) + ' - Server started at: ' + server.info.uri);
  }
});
