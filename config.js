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
var addMessage = require('./actions/add-message.js')
var config = {
  actions: [],
  trialKeys: trialKeys,
  adapterKeys: ["imap"],
  labelPrefix: LABEL_PREFIX,
  //actionTimeout: 1000 * 60 * 1 // 1 minute,
  actionTimeout: 100000
}


process.argv.forEach(function(val) {
  if(val === "c") config.actions.push(createLabel)
  else if (val === "d") config.actions.push(deleteLabel)
  else if(val === "u") config.actions.push(updateLabel)
})

module.exports = config
