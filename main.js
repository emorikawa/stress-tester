function shouldAdvanceStage() {
  if (currentStageIndex < 0) { return true }

  var actionStart = runData.stageData[currentStage()].actionStart

  var beenTooLong = Date.now() - actionStart > STAGE_TIMEOUT
  if (beenTooLong) {
    console.error("XXX> Timeoud out waiting for deltas. Check the output log.")
    return true
  }

  for (var labelName in runData.labelData) {
    if (!runData.labelData[labelName][currentStage()].deltaAt) { return false; }
  }
  return true;
}

function checkStageAdvance() {
  if (shouldAdvanceStage()) {
    var oldStage = currentStage()
    if (oldStage) {
      runData.stageData[oldStage].actionEnd = Date.now()
      runData.stageData[oldStage].actionTime = runData.stageData[oldStage].stageEnd - runData.stageData[oldStage].actionStart
    }

    currentStageIndex += 1;

    if (currentStageIndex >= STAGES.length) {
      nextAdapter()
    } else {
      var newStage = currentStage()
      runData.stageData[newStage].actionStart = Date.now()
      if (newStage === "create") {
        runCreate(currentAdapter())
      } else if (newStage === "delete") {
        runDelete(currentAdapter())
      }
    }
  }
}

var TestRunner = require('./test-runner')
var createLabel = require('./actions/create-label.js')
var deleteLabel = require('./actions/delete-label.js')

var trialNames = []
var now = Date.now();
var NUM_LABELS = 10;
for (var i = 0; i < NUM_LABELS; i++) {
  var trialName = "N1-Stress-Test-" + now + "-" + i;
  trialNames.push(trialName);
}

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
