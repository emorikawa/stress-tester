var deleteLabel = function(adapter, onTrialData) {
  console.log("---> Deleting Labels on "+adapter.name);

  var labelPrefix = require('../config.js').labelPrefix
  return adapter.listLabels().then(function(labels) {
    var toDelete = labels.filter(function(labelData){
      var prefixRe = new RegExp(labelPrefix, 'gi')
      return (prefixRe.test(adapter.key === "nylas" ? labelData.displayName : labelData.name))
    })
    return Promise.all(toDelete.map(function(labelData){
      var actionData = {}
      var labelName = adapter.key === "nylas" ? labelData.displayName : labelData.name
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
  return delta.event === "delete" && (delta.object === "label" || delta.object === "folder")
}

deleteLabel.trialNameFromDelta = function(delta, nylasIdLookup) {
  console.log("delta: ",delta, "nylasidLook: ", nylasIdLookup)

  for (var labelName in nylasIdLookup) {
    console.log("label name: ", labelName)
    if (nylasIdLookup[labelName] === delta.id) {
      return labelName;
    }
  }
  throw new Error("XXX> Couldn't find label with ID of "+delta.id)
}

module.exports = deleteLabel
