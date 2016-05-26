var fs = require('fs');
var path = require('path');
var configDir = path.join(process.env.HOME, ".credentials")
var nylasCredentials = require(path.join(configDir, "nylas.json"))

module.exports = {
  nylas: {
    key: "nylasAPI",
    name: "Nylas API",
    setup: function() { return Promise.resolve() },
    createLabel: function(name) {
      var lbl = nylas.labels.build({displayName: name});
      return lbl.save()
    },
    deleteLabel: function(remoteData) {
      return nylas.labels.delete(remoteData.id);
    },
    list: function() {
      return nylas.labels.list({})
    },
  },
}
