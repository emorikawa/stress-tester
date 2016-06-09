var fs = require('fs');
var path = require('path');
var configDir = path.join(process.env.HOME, ".credentials")
var nylasCredentials = require(path.join(configDir, "nylas.json"))

var nylasAPI = null;
var currentStream = null;

module.exports = {
  key: "nylas",
  name: "Nylas API",
  setup: function(adapterKey) {
    nylasAPI = require('nylas').config({
      apiServer: 'https://api-staging.nylas.com'
    }).with(nylasCredentials[adapterKey])
    return Promise.resolve(nylasAPI)
  },
  createLabel: function(name) {
    var lbl = nylasAPI.labels.build({displayName: name});
    return lbl.save()
  },
  deleteLabel: function(remoteData) {
    return nylasAPI.labels.delete(remoteData.id);
  },
  listLabels: function() {
    return nylasAPI.labels.list({})
  },
}
