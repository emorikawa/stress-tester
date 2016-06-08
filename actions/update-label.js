var updateLabel = function(adapter, onTrialData, config) {
  console.log("---> Updating Labels on "+adapter.name);

  var promiseChain = Promise.resolve()
  var errors = []
  var labelPrefix = require('../config.js').labelPrefix
  //get list of labels to change
  var now = Date.now()
  var count = 0

  // config.trialNames.forEach(function(labelName) {
  //
  //   console.log("Updating ", labelName)
  //   promiseChain = promiseChain.then(function(){
  //     var newName = labelPrefix + now + "-" + count
  //     count++
  //     return adapter.updateLabel(newName, )
  //     .then()
  //   })
  // })

  return adapter.list().then(function(labels) {
    //list of all folders
    var toRename = labels.filter(function(labelData){
      var prefixRe = new RegExp(labelPrefix, 'gi')
      return(prefixRe.test(labelData.name))
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
  return delta.event === "update" && (delta.object === "label" || delta.object === "folder")
}

updateLabel.trialNameFromDelta = function(delta){
  var keyName = delta.attributes.display_name;
  var parts = keyName.split("\\");
  keyName = parts[parts.length - 1]
  return keyName
}

module.exports = updateLabel
