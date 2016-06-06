var deleteLabel = function(adapter, onTrialData) {
  console.log("---> Deleting Labels on "+adapter.name);

  var labelPrefix = require('../config.js').labelPrefix
  var prefixRe = new RegExp(labelPrefix, 'gi')
  return adapter.list().then(function(labels) {
    var toDelete = labels.filter(function(labelData){
      return (prefixRe.test(labelData.name))
    })
    return Promise.all(toDelete.map(function(labelData) {
      var actionData = {}
      var labelName = labelData.name
      actionData[labelName] = {}
      var data = actionData[labelName]

      data.trialStart = Date.now();
      data.rawServerData = labelData
      console.log("Deleting", labelName)

      return adapter.deleteLabel(labelData)
      .then(function(){
        data.trialStop = Date.now();
        data.trialTime = data.trialStop - data.trialStart
        onTrialData(actionData)
        console.log("---> Deleted '"+labelName+"' in "+data.trialTime+" ms on "+adapter.name);
      })
      .catch(function(err){
        data.trialStop = Date.now()
        data.trialTime = data.trialStop - data.trialStart
        onTrialData(actionData)
        console.log("XXX> Error deleting '"+labelName+"' in "+data.trialTime+"ms on "+adapter.name);
        throw err
      })
    }));
  });
}
deleteLabel.key = "deleteLabel"

deleteLabel.isMatchingDelta = function(delta) {
  return delta.event === "create" && (delta.object === "label" || delta.object === "folder")
}

deleteLabel.trialNameFromDelta = function(delta, trialData) {
  for (var labelName in trialData) {
    if (trialData[trialName].rawServerData.id === delta.id) {
      return labelName;
    }
  }
  console.error(trialData)
  throw new Error("XXX> Couldn't find label with ID of "+delta.id)
}

module.exports = deleteLabel
