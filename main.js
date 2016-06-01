var TestRunner = require('./test-runner')

var trialNames = []
var now = Date.now();
var NUM_LABELS = 10;
for (var i = 0; i < NUM_LABELS; i++) {
  var trialName = "N1-Stress-Test-" + now + "-" + i;
  trialNames.push(trialName);
}

var createLabel = require('./actions/create-label.js')
var deleteLabel = require('./actions/delete-label.js')
var config = {
  actions: [createLabel, deleteLabel],
  trialNames: trialNames,
  adapterKeys: ["gmail", "nylas", "imap", "outlook"],
  actionTimeout: 1000 * 60 * 1 // 1 minute,
}

var testResults = new TestResults()
var testRunner = new TestRunner(config, testResults);

testRunner.runNextAdapter()
.then(testResults.finalizeTestResults.bind(testResults))
.catch(testResults.finalizeTestResults.bind(testResults))

process.on('SIGINT', function() {
  if (process.argv[2] !== "cleanup") {
    testResults.finalizeTestResults();
  }
  process.exit();
});

function cleanup(adapter) {
  console.log("---> Cleaning up N1-Stress-Test categories on "+adapter.name)
  adapter.list().then(function(labels) {
    var toDelete = labels.filter(function(label){
      return (/N1-Stress-Test/.test(label.name))
    })
    console.log("---> Found "+toDelete.length+" categories to delete")
    toDelete.forEach(function(label) {
      adapter.deleteLabel(label).then(function(){
        console.log("---> DELETED ", label.name)
      }).catch(console.error)
    })
  }).catch(console.error)
}
