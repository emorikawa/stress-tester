var fs = require('fs');
var path = require('path');
var configDir = path.join(process.env.HOME, ".credentials")
var outlookCredentials = require(path.join(configDir, "outlook.json"))

var FOLDER_PARAMS = {
  token: outlookCredentials.token,
  baseUrl: "https://outlook.office.com/api/v2.0/me/MailFolders",
}

var outlook = require('node-outlook')
Object.keys(outlook.mail).forEach(function(key) {
  var origFn = outlook.mail[key]
  var newFn = function(arg) {
    return new Promise(function(resolve, reject) {
      var newArg = Object.assign({}, {token: outlookCredentials.token}, arg)
      origFn(newArg, function(err, response) {
        if (err) { return reject(err) }
        return resolve(response)
      })
    })
  }
  outlook.mail[key] = newFn
})

module.exports = {
  key: "outlook",
  name: "Outlook API",
  setup: function() { return Promise.resolve() },
  createLabel: function(name) {
    return new Promise(function(resolve, reject){
      var url = FOLDER_PARAMS.baseUrl
      var params = Object.assign({}, FOLDER_PARAMS, {
        method: "POST",
        url: url + "/Inbox/childfolders",
        payload: {
          DisplayName: name,
        },
      });
      outlook.base.makeApiCall(params, function(err, resp){
        if(err) {return reject(err)}
        if(resp.statusCode >= 400) {
          return reject(new Error("Outlook API Error: "+resp.statusCode))
        }
        var rawFolder = resp.body;
        rawFolder.id = rawFolder.Id;
        rawFolder.name = rawFolder.DisplayName;
        resolve(rawFolder)
      })
    })
  },
  deleteLabel: function(remoteData) {
    return new Promise(function(resolve, reject){
      var url = FOLDER_PARAMS.baseUrl
      var params = Object.assign({}, FOLDER_PARAMS, {
        method: "DELETE",
        url: url + "/" + remoteData.id,
      });
      outlook.base.makeApiCall(params, function(err, resp){
        if(err) {return reject(err)}
        else resolve()
      })
    })
  },
  listLabels: function() {
    return new Promise(function(resolve, reject){
      var url = FOLDER_PARAMS.baseUrl
      var params = Object.assign({}, FOLDER_PARAMS, {
        method: "GET",
        url: url + "/Inbox/childfolders",
      });
      outlook.base.makeApiCall(params, function(err, resp){
        if(err) {return reject(err)}
        if (!resp.body || !resp.body.value) {
          return resolve([])
        }
        return resolve(resp.body.value.map(function(rawFolder){
          rawFolder.id = rawFolder.Id
          rawFolder.name = rawFolder.DisplayName
          return rawFolder
        }))
      })
    })
  },
}
