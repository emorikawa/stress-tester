var addEmail = function(adapter, onTrialData){
  console.log("---> Adding Emails on "+adapter.name)
  var labelPrefix = require('../config.js').labelPrefix

  return adapter.list().then(function(labels){
    var toAddToo = labels.filter(function(labelData){
      var prefixRe = new RegExp(labelPrefix, 'gi')
      return (prefixRe.test(labelData.name))
    })
    return Promise.all(toAddToo.map(function(labelData){
      var actionData = {}
      var labelName = labelData.name
      actionData[labelName] = {}
      var data = actionData[labelName]

      data.trialStart = Date.now();
      data.rawServerData = labelData


      console.log("Adding email to", labelName)

      return adapter.addEmail(labelData, Date.now())
      .then(function(){
        data.trialStop = Date.now();
        data.trialTime = data.trialStop - data.trialStart
        onTrialData(actionData)
        console.log("---> Added email to '"+labelName+"' in "+data.trialTime+" ms on "+adapter.name);
      })
      .catch(function(err){
        data.trialStop = Date.now()
        data.trialTime = data.trialStop - data.trialStart
        onTrialData(actionData)
        console.log("XXX> Error adding email to '"+labelName+"' in "+data.trialTime+"ms on "+adapter.name);
        throw err
      })
    }))
  })
}
addEmail.key = "addEmail"

addEmail.isMatchingDelta = function(delta){
  return delta.event === "modify" && delta.object === "message"
}

addEmail.trialNameFromDelta = function(delta){
  var keyName = delta.attributes.display_name;
  var parts = keyName.split("\\");
  keyName = parts[parts.length - 1]
  return keyName
}
module.exports = addEmail
