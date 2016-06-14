var moveMessage = function(adapter, onTrialData){
  console.log("---> Moving message on "+adapter.name)
  var labelPrefix = require('../config.js').labelPrefix


  var FROM = adapter.name === "IMAP" || adapter.name === "nylas" ? "n1stresstester@gmail.com" : "etmorikawa@yahoo.com"


  return adapter.listLabels().then(function(labels){
    var labelList = labels.filter(function(labelData){
      var prefixRe = new RegExp(labelPrefix, 'gi')
      return (prefixRe.test(labelData.name))
    })
    return adapter.openLabel('INBOX')
    .then(function(box){
     return  adapter.listMessages({'from': FROM}, box)
    })
    .then(function(messageArr){

      return Promise.all(labelList.map(function(labelData){
        var actionData = {}
        var labelName = labelData.name
        actionData[labelName] = {}
        var data = actionData[labelName]

        data.trialStart = Date.now();
        data.rawServerData = labelData

        var addMsg = messageArr.pop();

        console.log("Moving message " + addMsg + " to ", labelName)

        return adapter.moveMessage(addMsg, labelData)
        .then(function(){
          data.trialStop = Date.now();
          data.trialTime = data.trialStop - data.trialStart
          onTrialData(actionData)
          console.log("---> Moved message to '"+labelName+"' in "+data.trialTime+" ms on "+adapter.name);
        })
        .catch(function(err){
          data.trialStop = Date.now()
          data.trialTime = data.trialStop - data.trialStart
          onTrialData(actionData)
          console.log("XXX> Error moving message to '"+labelName+"' in "+data.trialTime+"ms on "+adapter.name);
          throw err
        })
      }))
    })
  })

}



moveMessage.key = "moveMessage"

moveMessage.isMatchingDelta = function(delta){
  return delta.event === "modify" && delta.object === "message"
}

moveMessage.trialKeyFromDelta = function(delta, nylasIdLookup){
  for (var labelKey in nylasIdLookup) {
    if(nylasIdLookup[labelKey].nylasId === delta.id) {
      return labelKey
    }
  }
  throw new Error("XXX> Couldn't find and update label with ID of "+delta.id)

}
module.exports = moveMessage
