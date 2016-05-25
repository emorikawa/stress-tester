var fs = require('fs')
var NUM_LABELS = 10;
var STAGE_TIMEOUT = 1000 * 60 * 5 // 5 minutes

var labelNames = []
var now = Date.now();
for (var i = 0; i < NUM_LABELS; i++) {
  var name = "N1-Stress-Test-" + now + "-" + i;
  labelNames.push(name);
}

var labelData = {"create": {}, "update": {}, "delete": {}}
var STAGES = ["create", "delete"]
var stageIndex = -1;
var gmail = null;

function printDelta(name, stage) {
  var remoteStart = labelData[stage][name].remoteStart
  var nylasStart = labelData[stage][name].nylasStart

  var deltaTime = labelData[stage][name].deltaTime

  var str = "---> DELTA: "+stage+" Label '"+name+"' "
  if (remoteStart) {
    str += ((deltaTime - remoteStart) + "ms since remote API start ")
  }
  if (nylasStart) {
    str += ((deltaTime - nylasStart) + "ms since Nylas API start ")
  }

  console.log(str);
}

function outputResults() {
  console.log("---> DONE!");
  labelData.runStop = Date.now()
  labelData.runTime = labelData.runStop - labelData.runStart
  console.log(labelData)
  var fname = "N1-stress-test-"+Date.now()+".json"
  fs.writeFileSync(name, JSON.stringify(labelData), {encoding: "utf8"})
  console.log("---> Wrote log to "+fname)
  process.exit(0);
}

function shouldAdvanceStage() {
  if (stageIndex < 0) { return true }
  var beenTooLong = Date.now() - labelData[STAGES[stageIndex]].stageStart > STAGE_TIMEOUT
  if (beenTooLong) {
    console.error("XXX> Timeoud out waiting for deltas. Check the output log.")
    return true
  }

  var stage = STAGES[stageIndex]
  for (var name in labelData[stage]) {
    if (name === "stageStart" || name === "stageEnd") { continue }
    if (!labelData[stage][name].deltaTime) { return false; }
  }
  return true;
}

function checkStageAdvance() {
  if (shouldAdvanceStage()) {
    var oldStage = STAGES[stageIndex]
    if (oldStage) {
      labelData[oldStage].stageEnd = Date.now()
      labelData[oldStage].stageTime = labelData[oldStage].stageEnd - labelData[oldStage].stageStart
    }

    stageIndex += 1;

    if (stageIndex >= STAGES.length) {
      outputResults()
    } else {
      var newStage = STAGES[stageIndex]
      labelData[newStage].stageStart = Date.now()
      runAdapter(newStage)
      if (newStage === "create") {
        runCreate()
      } else if (newStage === "delete") {
        runGmailDelete()
      }
    }
  }
}

function processDelta(delta) {
  try {
    if (delta.object === 'label') {
      var stage = delta.event
      var name = delta.attributes.display_name;

      var data = labelData[stage][name]

      if (!data) {
        console.error("XXX> Got a delta for an unknown label", name);
      }

      data.deltaTime = Date.now();
      if (data.remoteStart) {
        data.remoteAPIToDeltaTime = data.deltaTime - data.remoteStart
      }
      if (data.nylasStart) {
        data.nylasAPIToDeltaTime = data.deltaTime - data.nylasStart
      }
      printDelta(name, stage)
      checkStageAdvance()
    }
  } catch (err) {
    console.error('Delta streaming parse error:', err);
  }
}

function runCreate(adapter) {
  console.log("---> Creating Labels on "+adapter.name);
  var startKey = adapter.key = "Start"
  var endKey = adapter.key = "End"
  var dataKey = adapter.key = "Data"

  // stage = "create"
  labelNames.forEach(function(name) {
    if (!labelData[stage][name]) { labelData[stage][name] = {} }
    var data = labelData[stage][name];

    data[startKey] = Date.now();

    adapter.createLabel(name)
    .then(function(newLabel){
      data[endKey] = Date.now()
      console.log("---> Created '"+name+"' in "+(data[endKey] - data[startKey])+" ms");
      data.remoteData = newLabel;
      checkStageAdvance()
    })
    .catch(function(err){
      data[endKey] = Date.now()
      console.log("XXX> Error creating '"+name+"' in "+(data[endKey] - data[startKey])+"ms", err);
      data.remoteData = err;
      checkStageAdvance()
    })
  });
}

function runGmailDelete() {
  console.log("---> Deleting Labels on Gmail API");
  stage = "delete";

  labelNames.forEach(function(name) {
    if (!labelData[stage][name]) { labelData[stage][name] = {} }
    var data = labelData[stage][name];
    if (!labelData["create"][name].remoteData) {
      console.error("XXX> Can't find remote data and Gmail ID for", name);
      return
    }
    data.remoteStart = Date.now();
    gmail.users.labels.delete({"id": labelData["create"][name].remoteData.id})
    .then(function(){
      data.remoteDone = Date.now()
      console.log("---> Deleted '"+name+"' in "+(data.remoteDone - data.remoteStart)+" ms");
      checkStageAdvance()
    })
    .catch(function(err){
      data.remoteDone = Date.now()
      console.log("XXX> Error deleting '"+name+"' in "+(data.remoteDone - data.remoteStart)+"ms", err);
      data.remoteData = err;
      checkStageAdvance()
    })
  });
}

function cleanupGmail() {
  console.log("---> Cleaning up N1-Stress-Test labels on Gmail")
  gmail.users.labels.list().then(function(response) {
    labels = response.labels
    var toDelete = labels.filter(function(label){
      return (/N1-Stress-Test/.test(label.name))
    })
    console.log("---> Found "+toDelete.length+" labels to delete")
    toDelete.forEach(function(label) {
      gmail.users.labels.delete({id: label.id}).then(function(){
        console.log("---> DELETED ", label.name)
      }).catch(console.error)
    })
  }).catch(console.error)
}

var setupFn = require('./setup')
setupFn().then(function(setup) {
  gmail = setup.gmail; nylas = setup.nylas; cursor = setup.cursor;
  var stream = nylas.deltas.startStream(cursor, [], {exclude_folders: false});
  console.log("---> Listening to Nylas Delta with cursor: "+cursor);
  stream.on('delta', processDelta).on('error', function(err) {
    console.error('Delta streaming error:', err);
  });

  if (process.argv[2] === "cleanup") {
    cleanupGmail()
  } else {
    labelData.runStart = Date.now()
    checkStageAdvance()

    setInterval(checkStageAdvance, 500)
  }

}).catch(function(err) {
  console.error(err);
})

process.on('SIGINT', function() {
  outputResults();
  process.exit();
});
