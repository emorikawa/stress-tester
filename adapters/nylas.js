var fs = require('fs');
var path = require('path');
var configDir = path.join(process.env.HOME, ".credentials")
var nylasCredentials = require(path.join(configDir, "nylas.json"))

var nylasAPI = null;
var currentStream = null;

//*** switch out depending on provider -- there is a probs better way to do this
var provider = "imap"

module.exports = {
  key: "nylas",
  name: "Nylas API",
  setup: function() {
    nylasAPI = require('nylas').config({
      apiServer: 'https://api-staging.nylas.com'
    }).with(nylasCredentials[provider])
    return Promise.resolve(nylasAPI)
  },
  createLabel: function(name) {
    var lbl = (provider === "gmail" ? nylasAPI.labels.build({displayName: name}) : nylasAPI.folders.build({displayName: name}));
    return lbl.save()
  },
  deleteLabel: function(remoteData) {
    return (provider === "gmail" ? nylasAPI.labels.delete(remoteData.id) : nylasAPI.folders.delete(remoteData.id))
  },
  updateLabel: function(newName, remoteData) {
    remoteData.displayName = newName
    return remoteData.save()
  },
  listLabels: function() {
    return (provider === "gmail" ? nylasAPI.labels.list({}) : nylasAPI.folders.list({}))
  },
  moveMessage: function() {
    
  }
}
