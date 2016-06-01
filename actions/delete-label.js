var deleteLabel = function(adapter, onTrialData, adapterDataClone, config) {
  console.log("---> Deleting Labels on "+adapter.name);

  actionData = {}

  return Promise.all(config.trialNames.map(function(labelName) {
    actionData[labelName] = {}
    data = actionData[labelName]

    data.trialStart = Date.now();
    console.log("Deleting", labelName)

    var labelId = adpaterDataClone.trialData.deleteLabel[labelName].rawServerData.id
    return adapter.deleteLabel(labelId)
    .then(function(){
      data.trialStop = Date.now();
      data.trialTime = data.trialStop - data.trialStart
      console.log("---> Deleted '"+labelName+"' in "+data.trialTime+" ms on "+adapter.name);
    })
    .catch(function(err){
      data.trialStop = Date.now()
      data.trialTime = data.trialStop - data.trialStart
      console.log("XXX> Error deleting '"+labelName+"' in "+data.trialTime+"ms on "+adapter.name, err);
    })
  })).then(function(){
    return Promise.resolve(actionData)
  });
}
deleteLabel.name = "deleteLabel"

deleteLabel.isMatchingDelta = function(delta) {
  return delta.event === "create" && (delta.object === "label" || delta.object === "folder")
}

deleteLabe.trialNameFromDelta = function(delta, adapter) {
  for (var labelName in adapterData.trialData) {
    var trialData = adapterData.trialData[labelName].rawServerData || {}
    if (trialData.id === delta.id) {
      return labelName;
    }
  }
  if (!labelName) {
    throw new Error("XXX> Couldn't find label with ID of "+delta.id)
  }
}
module.exports = deleteLabel
