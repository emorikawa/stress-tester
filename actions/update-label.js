var updateLabel = function(adapter, onTrialData, config) {
  console.log("---> Updating Labels on "+adapter.name);


  var labelPrefix = require('../config.js').labelPrefix

  var now = Date.now()
  var count = 0
  return adapter.listLabels().then(function(labels) {
    var toRename = labels.filter(function(labelData){
      var prefixRe = new RegExp(labelPrefix, 'gi')
      return (prefixRe.test(labelData.name))
    })
    return Promise.all(toRename.map(function(labelData){
      var actionData = {}
      var labelKey = labelData.name
      actionData[labelKey] = {}
      var data = actionData[labelKey]

      data.trialStart = Date.now()
      data.rawServerData = labelData
      data.labelKey = labelKey

      var newName = labelPrefix + now + "-" + count
      count++
      console.log("Updating", data.labelKey, " to ", newName)

      return adapter.updateLabel(newName, labelData)
      .then(function(){
        data.trialStop = Date.now();
        data.trialTime = data.trialStop - data.trialStart

        onTrialData(actionData)
        console.log("---> Updated '"+data.labelKey+"' in "+data.trialTime+" ms on "+adapter.name);
      })
      .catch(function(err){
        data.trialStop = Date.now()
        data.trialTime = data.trialStop - data.trialStart
        onTrialData(actionData)
        console.log("XXX> Error updating '"+data.labelKey+"' in "+data.trialTime+"ms on "+adapter.name);
        throw err
      })
    }))
  })
}
updateLabel.key = "updateLabel"

updateLabel.isMatchingDelta = function(delta){
  return delta.event === "modify" && (delta.object === "label" || delta.object === "folder")
}

updateLabel.trialKeyFromDelta = function(delta, nylasIdLookup){
  for (var labelKey in nylasIdLookup) {
    if(nylasIdLookup[labelKey].nylasId === delta.id) {
      return labelKey
    }
  }
  throw new Error("XXX> Couldn't find and update label with ID of "+delta.id)

}

module.exports = updateLabel
