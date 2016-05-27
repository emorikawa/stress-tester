var fs = require('fs');
var path = require('path');
var configDir = path.join(process.env.HOME, ".credentials")
var nylasCredentials = require(path.join(configDir, "nylas.json"))

var nylasAPI = null;
var currentStream = null;

module.exports = {
  nylas: {
    key: "nylasAPI",
    name: "Nylas API",
    setup: function(adapterName) {
      // return new Promise(function(resolve, reject) {
      //   var nylasToken = nylasCredentials[adapterName]
      //   nylasAPI = require('nylas').with(nylasToken)
      //
      //   nylasAPI.deltas.latestCursor(function onLatestCursor(err, cursor) {
      //     if (err) {
      //       return reject(err)
      //     }
      //
      //     if (currentStream && currentStream.close) {
      //       currentStream.close()
      //     }
      //
      //     currentStream = nylasAPI.deltas.startStream(cursor, [],
      //       {exclude_folders: false});
      //     console.log("---> Listening to Nylas Delta with cursor: "+cursor);
      //     currentStream.on('delta', processDelta).on('error', function(err) {
      //       console.error('Delta streaming error:', err);
      //     });
      //
      //     resolve()
      //   })
      // })
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
