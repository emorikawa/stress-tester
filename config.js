var LABEL_PREFIX = "N1-Stress-Test-"
var trialNames = []
var now = Date.now();
var NUM_LABELS = 10;
for (var i = 0; i < NUM_LABELS; i++) {
  var trialName = LABEL_PREFIX + now + "-" + i;
  trialNames.push(trialName);
}

var createLabel = require('./actions/create-label.js')
var deleteLabel = require('./actions/delete-label.js')
var config = {
  actions: [createLabel, deleteLabel],
  trialNames: trialNames,
  adapterKeys: ["gmail"],
  labelPrefix: LABEL_PREFIX,
  actionTimeout: 1000 * 60 * 1 // 1 minute,
}

module.exports = config
