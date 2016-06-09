var updateLabel = function(adapter, onTrialData, config) {
  console.log("---> Updating Labels on "+adapter.name);


  var labelPrefix = require('../config.js').labelPrefix

  var now = Date.now()
  var count = 0

  return adapter.list().then(function(labels) {
    var toRename = labels.filter(function(labelData){
      var prefixRe = new RegExp(labelPrefix, 'gi')
      return (prefixRe.test(labelData.name))
    })
    return Promise.all(toRename.map(function(labelData){
      var actionData = {}
      var labelName = labelData.name
      actionData[labelName] = {}
      var data = actionData[labelName]

      data.trialStart = Date.now();
      data.rawServerData = labelData

      var newName = labelPrefix + now + "-" + count
      count++
      console.log("Updating", labelName, " to ", newName)

      return adapter.updateLabel(newName, labelData)
      .then(function(){
        data.trialStop = Date.now();
        data.trialTime = data.trialStop - data.trialStart
        onTrialData(actionData)
        console.log("---> Updated '"+labelName+"' in "+data.trialTime+" ms on "+adapter.name);
      })
      .catch(function(err){
        data.trialStop = Date.now()
        data.trialTime = data.trialStop - data.trialStart
        onTrialData(actionData)
        console.log("XXX> Error updating '"+labelName+"' in "+data.trialTime+"ms on "+adapter.name);
        throw err
      })
    }))
  })
}
updateLabel.key = "updateLabel"

updateLabel.isMatchingDelta = function(delta){
  return delta.event === "modify" && (delta.object === "label" || delta.object === "folder")
}

updateLabel.trialNameFromDelta = function(delta){
  var keyName = delta.attributes.display_name;
  var parts = keyName.split("\\");
  keyName = parts[parts.length - 1]
  return keyName
}

module.exports = updateLabel
