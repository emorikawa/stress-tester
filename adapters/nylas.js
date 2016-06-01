var fs = require('fs');
var path = require('path');
var configDir = path.join(process.env.HOME, ".credentials")
var nylasCredentials = require(path.join(configDir, "nylas.json"))

var nylasAPI = null;
var currentStream = null;

module.exports = {
  nylas: {
    key: "nylas",
    name: "Nylas API",
    setup: function(adapterKey) {
      return Promise.resolve(nylasCredentials[adapterKey])
    },
    createLabel: function(name) {
      var lbl = nylasAPI.labels.build({displayName: name});
      return lbl.save()
    },
    deleteLabel: function(remoteData) {
      return nylasAPI.labels.delete(remoteData.id);
    },
    list: function() {
      return nylasAPI.labels.list({})
    },
  },
}
