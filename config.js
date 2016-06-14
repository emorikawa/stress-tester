var LABEL_PREFIX = "N1-Stress-Test-"
var trialKeys = []
var now = Date.now();
var NUM_LABELS = 1;
for (var i = 0; i < NUM_LABELS; i++) {
  var trialKey = LABEL_PREFIX + now + "-" + i;
  trialKeys.push(trialKey);
}

var createLabel = require('./actions/create-label.js')
var updateLabel = require('./actions/update-label.js')
var deleteLabel = require('./actions/delete-label.js')
var moveMessage = require('./actions/move-message.js')
var config = {
  actions: [],
  trialKeys: trialKeys,
  adapterKeys: ["IMAP"],
  labelPrefix: LABEL_PREFIX,
  //actionTimeout: 1000 * 60 * 1 // 1 minute,
  actionTimeout: 10000
}


process.argv.forEach(function(val) {
  if(val === "create") config.actions.push(createLabel)
  else if (val === "delete") config.actions.push(deleteLabel)
  else if(val === "update") config.actions.push(updateLabel)
  else if(val == "move") config.actions.push(moveMessage)
})

module.exports = config
