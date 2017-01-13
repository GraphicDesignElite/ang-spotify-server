// Get dependencies
const express = require('express');
const path = require('path');
const http = require('http');
const bodyParser = require('body-parser');

var request = require('request');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');

const app = express();
var cors = require('cors');
app.use(cors());

// Parsers for POST data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// Point static path to dist
app.use(express.static(path.join(__dirname))).use(cookieParser());

// Get our API routes
const api = require('./server/routes/api');
app.use('/api', api);


const siteURL = "http://localhost:3000";
const apiURL = "http://localhost:5000";

/* Spotify Routes */
var client_id = 'insert yours'; // Your client id
var client_secret = 'insert yours'; // Your secret
var redirect_uri = apiURL + '/callback'; // Your redirect uri
var access;
  /**
   * Generates a random string containing numbers and letters
   * @param  {number} length The length of the string
   * @return {string} The generated string
   */
var generateRandomString = function(length) {
    var text = '';
    var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (var i = 0; i < length; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var stateKey = 'spotify_auth_state';

app.get('/auth', function(req, res) {
    var state = generateRandomString(16);
    res.cookie(stateKey, state);
    // Request Auth
    var scope = 'user-read-private user-read-email user-follow-read user-follow-modify';
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      })
    );
});

app.get('/callback', function(req, res) {
  
  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token,
            expires_in = body.expires_in;


        res.redirect( siteURL + '/search?' +
          querystring.stringify({
            access_token: access_token,
            refresh_token: refresh_token,
            expires_in: expires_in
          }));
      } else {
        res.redirect(siteURL + '/search?' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});
app.get('/refresh_token', function(req, res) {
  // requesting access token from refresh token
  var refresh_token = req.query.refresh_token;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      res.send({
        'access_token': access_token
      });
    }
  });
});





 


// Catch all other routes and return the index file
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error Handler Logger
function logErrors (err, req, res, next) {
  console.error(err.stack)
  next(err)
}
// Error Handler Basic
app.use(function (err, req, res, next) {
  res.status(500).send('Access Failed.')
}) 

/**
 * Get port from environment and store in Express.
 */
const port = process.env.PORT || '5000';
app.set('port', port);

/**
 * Create HTTP server.
 */
const server = http.createServer(app);

/**
 * Listen on provided port, on all network interfaces.
 */
server.listen(port, () => console.log(`API running on localhost:${port}`));