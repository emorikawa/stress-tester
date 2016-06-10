var createLabel = function(adapter, onTrialData, adapterDataClone, config) {
  console.log("---> Creating Labels on "+adapter.name);

  var promiseChain = Promise.resolve();
  var errors = []
//create labelKey
//use this as key
//set displayName initialized to labelKey

//find and replace labelName in some places
  config.trialKeys.forEach(function(labelKey) {
    var actionData = {}
    actionData[labelKey] = {}
    var data = actionData[labelKey]
    console.log("data: ", data)
    data.trialStart = Date.now();
    data.labelName = labelKey
    console.log("Creating", data.labelName)

    promiseChain = promiseChain.then(function(){
      return adapter.createLabel(data.labelName)
      .then(function(newLabel){
        data.trialStop = Date.now();
        data.trialTime = data.trialStop - data.trialStart
        data.rawServerData = newLabel;
        onTrialData(actionData)
        console.log("---> Created '"+data.labelName+"' in "+data.trialTime+" ms on "+adapter.name);
      })
      .catch(function(err){
        data.trialStop = Date.now()
        data.trialTime = data.trialStop - data.trialStart
        data.rawServerData = err;
        onTrialData(actionData);
        console.error("XXX> Error creating '"+data.labelName+"' in "+data.trialTime+"ms on "+adapter.name);
        errors.push(err)
      })
    })
  });

  return promiseChain.then(function(){
    if (errors.length > 0) {
      throw new Error(errors)
    }
  })
}
createLabel.key = "createLabel"

createLabel.isMatchingDelta = function(delta) {
  return delta.event === "create" && (delta.object === "label" || delta.object === "folder")
}

createLabel.trialNameFromDelta = function(delta) {
  var keyName = delta.attributes.display_name;
  var parts = keyName.split("\\");
  keyName = parts[parts.length - 1]
  return keyName
}

module.exports = createLabel
