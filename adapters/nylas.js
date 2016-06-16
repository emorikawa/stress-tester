var fs = require('fs');
var path = require('path');
var configDir = path.join(process.env.HOME, ".credentials")
var nylasCredentials = require(path.join(configDir, "nylas.json"))

var nylasAPI = null;
var currentStream = null;

//*** switch out depending on provider -- there is a probs better way to do this
var provider = "gmail"

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
    if(provider === "imap"){
      return nylasAPI.folders.find(remoteData.id).then(function(folder){
        folder.displayName = newName
        return folder.save()
      })
    }else if(provider ==="gmail") {
      return nylasAPI.labels.find(remoteData.id).then(function(label){
        label.displayName = newName
        return label.save()
      })
    } else {
      console.log("ADD PROVIDER: ", provider)
    }
  },
  listLabels: function() {
    if(provider === "imap"){
      return nylasAPI.folders.list({}).then(function(folderArr){
        var prettyFoldArr = []
        folderArr.map(function(folder){
          prettyFoldArr.push({name: folder.displayName, id: folder.id})
        })
        return prettyFoldArr
      })
    }
    else if(provider ==="gmail") {
      return nylasAPI.labels.list({}).then(function(labelArr){
        var prettyArr = []
        labelArr.map(function(label){
          prettyArr.push({name: label.displayName, id: label.id})
        })
        return prettyArr
      })
    }
    else (console.log("ADD PROVIDER: ", provider))
  },
  moveMessage: function(msgId, remoteData) {
    return nylasAPI.messages.find(msgId).then(function(msg){
      if (provider === "gmail") {
        return nylasAPI.labels.find(remoteData.id).then(function(label){
          msg.labels.push(label)
          return msg.save()
        })
      } else {
        return nylasAPI.folders.find(remoteData.id).then(function(folder){
          msg.folder = folder
          return msg.save()
        })
      }
    })
  },
  openLabel: function() {
    return Promise.resolve()
  },
  listMessages: function(criteriaObj) {
    return nylasAPI.messages.list({from: criteriaObj.from})
    .then(function(messageArr){
      var msgIds = []
      messageArr.map(function(msg){
        msgIds.push(msg.id)
      })
      return msgIds
    })
  }
}
