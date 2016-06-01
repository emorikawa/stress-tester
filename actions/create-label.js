var createLabel = function(adapter, onTrialData, adapterDataClone, config) {
  console.log("---> Creating Labels on "+adapter.name);

  actionData = {}

  return Promise.all(config.trialNames.map(function(labelName) {
    actionData[labelName] = {}
    data = actionData[labelName]

    data.trialStart = Date.now();
    console.log("Creating", labelName)

    return adapter.createLabel(labelName)
    .then(function(newLabel){
      data.trialStop = Date.now();
      data.trialTime = data.trialStop - data.trialStart
      data.rawServerData = newLabel;
      console.log("---> Created '"+labelName+"' in "+data.trialTime+" ms on "+adapter.name);
    })
    .catch(function(err){
      data.trialStop = Date.now()
      data.trialTime = data.trialStop - data.trialStart
      data.rawServerData = err;
      console.log("XXX> Error creating '"+labelName+"' in "+data.trialTime+"ms on "+adapter.name, err);
    })
  })).then(function(){
    return Promise.resolve(actionData)
  });
}
createLabel.name = "createLabel"

createLabel.isMatchingDelta = function(delta) {
  return delta.event === "create" && (delta.object === "label" || delta.object === "folder")
}

createLabel.trialNameFromDelta = function(delta, adapter, testResults) {
  var keyName = delta.attributes.display_name;
  var parts = keyName.split("\\");
  keyName = parts[parts.length - 1]
  return keyName
}
module.exports = createLabel
