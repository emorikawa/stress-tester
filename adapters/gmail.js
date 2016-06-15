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


var getFrom = function (messagePayload){
  var emailArr = messagePayload.filter(function(header) {
    return (header['name'] === 'From')
  })
  return emailArr
}

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
  listLabels: function() {
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
  listMessages: function(criteriaObj) {
    return gmail.users.messages.list({labelIds : 'UNREAD'})
    .then(function(messageArr){
      var ids = []
      messageArr.messages.map(function(message){
        ids.push(message.id)
      })
      return ids;
    })
  },
  updateLabel: function(newName, remoteData) {
    return gmail.users.labels.update({
      id: remoteData.id,
      resource: {name: newName}
    })
  },
  openLabel: function(){
    return Promise.resolve()
  },
  moveMessage: function(source, remoteData) {
    return gmail.users.messages.modify({userId:'me', id: source, resource: {addLabelIds: [remoteData.id]}})
  },

}
