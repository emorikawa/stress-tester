var fs = require('fs');
var path = require('path');

var configDir = path.join(process.env.HOME, ".credentials")

var nylasCredentials = require(path.join(configDir, "nylas.json"))
var imapCredentials = require(path.join(configDir, "imap.json"))
var gmailCredentials = require(path.join(configDir, "gmail.json"))
var outlookCredentials = require(path.join(configDir, "outlook.json"))

var GoogleAuthLibrary = require('google-auth-library')
var googleAuth = new GoogleAuthLibrary()
var googleOAuth2 = new googleAuth.OAuth2();
googleOAuth2.credentials = gmailCredentials

module.exports = {
  nylas: nylasCredentials,
  imap: imapCredentials,
  outlook: outlookCredentials,
  gmail: {auth: googleOAuth2, userId: "me"},
}
