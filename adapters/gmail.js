var fs = require('fs');
var path = require('path');
var base64 = require('base64url')

var configDir = path.join(process.env.HOME, ".credentials")

var gmailCredentials = require(path.join(configDir, "gmail.json"))

var GoogleAuthLibrary = require('google-auth-library')
var googleAuth = new GoogleAuthLibrary()
var googleOAuth2 = new googleAuth.OAuth2();
googleOAuth2.credentials = gmailCredentials

var gmail = require('googleapis').gmail('v1');
var defaultGmailArgs = {auth: googleOAuth2, userId: "me"}

var toPromise = [gmail.users.labels, gmail.users.messages]

toPromise.map(function(gmailObj) {
  Object.keys(gmailObj).forEach(function(key) {
    var origFn = gmailObj[key]
    var newFn = function(arg) {
      return new Promise(function(resolve, reject) {
        var newArg = Object.assign({}, defaultGmailArgs, arg)
        origFn(newArg, function(err, response) {
          if (err) { return reject(err) }
          return resolve(response)
        })
      })
    }
   gmailObj[key] = newFn
  })
})


module.exports = {
  key: "gmail",
  name: "Gmail API",
  setup: function() { return Promise.resolve() },
  createLabel: function(name) {
    return gmail.users.labels.create({resource: {name: name}})
  },
  deleteLabel: function(remoteData) {
    return gmail.users.labels.delete({id: remoteData.id})
  },
  list: function() {
    return gmail.users.labels.list().then(function(response){
      var data = response.labels.map(function(label) {
        return {
          name: label.name,
          id: label.id,
        }
      })
      return Promise.resolve(data)
    })
  },
  updateLabel: function(newName, remoteData) {
    return gmail.users.labels.update({
      id: remoteData.id,
      resource: {name: newName}
    })
  },
  addEmail: function(remoteData, date) {
    console.log(remoteData.id)
    return gmail.users.messages.insert({userId: "me", resource: {raw: base64("encode me"), labelIds: [remoteData.id]}})
  },
}
