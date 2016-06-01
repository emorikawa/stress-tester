var deleteLabel = function(adapter, onTrialData, adapterDataClone, config) {
  console.log("---> Deleting Labels on "+adapter.name);

  return Promise.all(config.trialNames.map(function(labelName) {
    var actionData = {}
    actionData[labelName] = {}
    var data = actionData[labelName]

    data.trialStart = Date.now();
    console.log("Deleting", labelName)

    var labelId = adpaterDataClone.trialData.deleteLabel[labelName].rawServerData.id
    return adapter.deleteLabel(labelId)
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
      console.log("XXX> Error deleting '"+labelName+"' in "+data.trialTime+"ms on "+adapter.name, err);
    })
  }));
}
deleteLabel.name = "deleteLabel"

deleteLabel.isMatchingDelta = function(delta) {
  return delta.event === "create" && (delta.object === "label" || delta.object === "folder")
}

deleteLabe.trialNameFromDelta = function(delta, trialData) {
  for (var labelName in trialData) {
    if (trialData[trialName].rawServerData.id === delta.id) {
      return labelName;
    }
  }
  console.error(trialData)
  throw new Error("XXX> Couldn't find label with ID of "+delta.id)
}

module.exports = deleteLabel
