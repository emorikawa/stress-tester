var fs = require('fs')

var NUM_LABELS = 10;
var STAGE_TIMEOUT = 1000 * 60 * 1 // 1 minutes

var labelNames = []

var adapters = {}
var ADAPTER_NAMES = ["gmail", "nylas", "imap", "outlook"]
var currentAdapterNameIndex = -1

var STAGES = ["create", "delete"]
var runData = {stageData: stageInit(), labelData: {}}
var currentStageIndex = -1;

var currentStream = null;

var now = Date.now();
for (var i = 0; i < NUM_LABELS; i++) {
  var globalLabelName = "N1-Stress-Test-" + now + "-" + i;
  labelNames.push(globalLabelName);
}

function currentAdapter() {
  return adapters[ADAPTER_NAMES[currentAdapterNameIndex]]
}

function currentStage() {
  return STAGES[currentStageIndex]
}

function mean(values) {
  if (!values || values.length === 0) {
    return 0;
  }
  var sum = values.reduce((function(sum, value) {return sum + value}), 0)
  return sum / values.length
}

function stdev(values) {
  if (!values || values.length === 0) {
    return 0;
  }
  var avg = mean(values)
  var squareDiffs = values.map(function(val) { return Math.pow((val - avg), 2)})
  return Math.sqrt(mean(squareDiffs))
}

function stageInit() {
  var init = {}
  STAGES.forEach(function(stage) {
    init[stage] = {}
  });
  return init;
}

function outputResults() {
  console.log("---> DONE!");
  runData.runStop = Date.now()
  runData.runTime = runData.runStop - runData.runStart

  avgData = {mean: {}, stdev: {}}
  for (var labelName in runData.labelData) {
    for (var i = 0; i < STAGES.length; i++) {
      var stage = STAGES[i]
      for (var stageStat in runData.labelData[labelName][stage]) {
        if (/Time/.test(stageStat)) {
          var key = stage+" "+stageStat
          if (!avgData.mean[key]) {avgData.mean[key] = []}
          if (!avgData.stdev[key]) {avgData.stdev[key] = []}
          avgData.mean[key].push(runData.labelData[labelName][stage][stageStat])
          avgData.stdev[key].push(runData.labelData[labelName][stage][stageStat])
        }
      }
    }
  }
  for (var meanStat in avgData.mean) {
    avgData.mean[meanStat] = Math.round(mean(avgData.mean[meanStat]))
  }
  for (var meanStat in avgData.stdev) {
    avgData.stdev[meanStat] = Math.round(stdev(avgData.stdev[meanStat]))
  }

  runData.avgData = avgData

  console.log(runData.labelData)
  console.log(runData.stageData)
  console.log(runData.avgData)
  console.log(runData.runTime)
  var fname = "N1-stress-test-"+Date.now()+".json"
  fs.writeFileSync(fname, JSON.stringify(runData), {encoding: "utf8"})
  console.log("---> Wrote log to "+fname)
  process.exit(0);
}

function shouldAdvanceStage() {
  if (currentStageIndex < 0) { return true }

  var stageStart = runData.stageData[currentStage()].stageStart

  var beenTooLong = Date.now() - stageStart > STAGE_TIMEOUT
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
      runData.stageData[oldStage].stageEnd = Date.now()
      runData.stageData[oldStage].stageTime = runData.stageData[oldStage].stageEnd - runData.stageData[oldStage].stageStart
    }

    currentStageIndex += 1;

    if (currentStageIndex >= STAGES.length) {
      nextAdapter()
    } else {
      var newStage = currentStage()
      runData.stageData[newStage].stageStart = Date.now()
      if (newStage === "create") {
        runCreate(currentAdapter())
      } else if (newStage === "delete") {
        runDelete(currentAdapter())
      }
    }
  }
}

function nextAdapter() {
  currentStageIndex = -1;
  currentAdapterNameIndex += 1;
  if (currentAdapterNameIndex >= ADAPTER_NAMES.length) {
    outputResults();
  } else {
    setupNylasAPI(ADAPTER_NAMES[currentAdapterNameIndex]);
  }
}

function setupNylasAPI(adapterName) {
  return new Promise(function(resolve, reject) {
    var nylasToken = require('./credentials.js').nylas[adapterName]
    var nylasAPI = require('nylas').with(nylasToken)

    nylasAPI.deltas.latestCursor(function onLatestCursor(err, cursor) {
      if (err) {
        return reject(err)
      }

      if (currentStream && currentStream.close) {
        currentStream.close()
      }

      currentStream = nylasAPI.deltas.startStream(setup.cursor, [],
        {exclude_folders: false});
      console.log("---> Listening to Nylas Delta with cursor: "+setup.cursor);
      currentStream.on('delta', processDelta).on('error', function(err) {
        console.error('Delta streaming error:', err);
      });

      resolve()
    })
  })
}

function processDelta(delta) {
  try {
    if (delta.object === "label" || delta.object === "folder") {
      var stage = delta.event;
      if (STAGES.indexOf(delta.event) === -1) {
        console.error("XXX> Unsupported delta event", delta.event, delta);
        return;
      }

      var labelName = null
      var dataKey = currentAdapter().key + "Data"

      if (delta.event === "delete") {
        for (var labelKey in runData.labelData) {
          var labelData = runData.labelData[labelKey][dataKey] || {}
          if (labelData.id === delta.id) {
            labelName = labelKey;
            break;
          }
        }
        if (!labelName) {
          console.error("XXX> Couldn't find label with ID of ", delta.id)
          return;
        }
      } else {
        if (!delta.attributes || !delta.attributes.display_name) {
          console.error("XXX> Unknown delta", delta);
          return;
        }
        var labelName = delta.attributes.display_name;
        var parts = labelName.split("\\");
        labelName = parts[parts.length - 1]
        runData.labelData[labelName][dataKey].id = delta.attributes.id
      }

      var data = runData.labelData[labelName][stage]

      if (!data) {
        console.error("XXX> Got a delta for an unknown label", labelName);
      }

      data.deltaAt = Date.now();

      var deltaKey = currentAdapter().key + "ToDeltaTime";
      var startKey = currentAdapter().key + "Start"
      data[deltaKey] = data.deltaAt - data[startKey]

      console.log("---> DELTA: "+stage+" Label '"+labelName+"' "+data[deltaKey]+" ms since "+currentAdapter().name+" start")

      checkStageAdvance()
    }
  } catch (err) {
    console.error('Delta streaming parse error:', err);
  }
}

function runCreate(adapter) {
  console.log("---> Creating Labels on "+adapter.name);
  var startKey = adapter.key + "Start"
  var endKey = adapter.key + "End"
  var timeKey = adapter.key + "Time"
  var dataKey = adapter.key + "Data"

  labelNames.forEach(function(labelName) {
    if (!runData.labelData[labelName]) {
      runData.labelData[labelName] = stageInit()
    }

    var data = runData.labelData[labelName].create;

    data[startKey] = Date.now();
    console.log("Creating", labelName)
    adapter.createLabel(labelName)
    .then(function(newLabel){
      data[endKey] = Date.now();
      data[timeKey] = data[endKey] - data[startKey]
      runData.labelData[labelName][dataKey] = newLabel;
      console.log("---> Created '"+labelName+"' in "+data[timeKey]+" ms on "+adapter.name);
      checkStageAdvance()
    })
    .catch(function(err){
      data[endKey] = Date.now()
      data[timeKey] = data[endKey] - data[startKey]
      runData.labelData[labelName][dataKey] = err;
      console.log("XXX> Error creating '"+labelName+"' in "+data[timeKey]+"ms on "+adapter.name, err);
      checkStageAdvance()
    })
  });
}

function runDelete(adapter) {
  console.log("---> Deleting Labels on "+adapter.name);
  var startKey = adapter.key + "Start"
  var endKey = adapter.key + "End"
  var timeKey = adapter.key + "Time"
  var dataKey = adapter.key + "Data"

  labelNames.forEach(function(labelName) {
    if (!runData.labelData[labelName]) {
      runData.labelData[labelName] = stageInit()
    }

    var data = runData.labelData[labelName].delete;

    var remoteData = runData.labelData[labelName][dataKey]
    if (!remoteData) {
      console.error("XXX> Can't find "+adapter.name+" data and id for", labelName);
      return
    }

    data[startKey] = Date.now();
    adapter.deleteLabel(remoteData)
    .then(function(){
      data[endKey] = Date.now();
      data[timeKey] = data[endKey] - data[startKey]
      console.log("---> Deleted '"+labelName+"' in "+data[timeKey]+" ms on "+adapter.name);
      checkStageAdvance()
    })
    .catch(function(err){
      data[endKey] = Date.now()
      data[timeKey] = data[endKey] - data[startKey]
      console.log("XXX> Error deleting '"+labelName+"' in "+data[timeKey]+"ms on "+adapter.name, err);
      checkStageAdvance()
    })
  });
}

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

var setupFn = require('./setup')
setupFn().then(function(setup) {
  adapters = require('./adapters.js')(setup);
  if (process.argv[2] === "cleanup") {
    cleanup(currentAdapter())
  } else {
    runData.runStart = Date.now()
    checkStageAdvance()
    setInterval(checkStageAdvance, 500)
  }

}).catch(function(err) {
  console.error(err);
})

process.on('SIGINT', function() {
  if (process.argv[2] !== "cleanup") {
    outputResults();
  }
  process.exit();
});
