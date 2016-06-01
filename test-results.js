var fs = require('fs')
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

/**
 * Test Results.
 *
 * testResults:
 *   gmail: (adapter.key)
 *     createLabel: (action.name)
 *       trialData:
 *         "N1-Stress-Test-00000-1": (trialName)
 *           rawServerData:
 *             id: number,
 *             ...
 *           trialStart: timestamp
 *           trialStop: timestamp
 *           trialTime: timestamp
 *         "N1-Stress-Test-00000-2": (trialName)
 *           ...
 *         "N1-Stress-Test-00000-3": (trialName)
 *           ...
 *         ... (trialName)
 *       actionStart: timestamp
 *       actionStop: timestamp
 *       actionTime: timestamp
 *     updateLabel: (action.name)
 *       ...
 *     deleteLabel: (action.name)
 *       ...
 *     ... (action.name)
 *     avgData:
 *       createLabel: (action.name)
 *         mean: number
 *         stdev: number
 *       updateLabel: (action.name)
 *         ...
 *       deleteLabel: (action.name)
 *         ...
 *       ...
 *     adapterStart: timestamp
 *     adapterStop: timestamp
 *     adapterTime: timestamp
 *   imap: (adapter.key)
 *     ...
 *   outlook: (adapter.key)
 *     ...
 *   nylas: (adapter.key)
 *     ...
 *   ... (adapter.key)
 *   testStart: timestamp
 *   testStop: timestamp
 *   testTime: timestamp
 */
var TestResults = (function() {
  function TestResults() {
    this.testResults = {}
    this.currentAdapter = null
    this.currentAction = null
    this.testResults.testStart = Date.now()
  }

  TestResults.prototype.onDelta = function(delta) {
    if (!delta || !delta.attributes) {
      console.error("XXX> Malformed delta", delta)
      return;
    }
    if (!this.currentAction.isMatchingDelta(delta)) {
      return;
    }

    var trialData = this.testResults[this.currentAdapter.key][this.currentAction.name].trialData

    try {
      var trialName = this.currentAction.trialNameFromDelta(delta, adpaterData)
      trialData[keyName]
    } catch (err) {
      console.error('Delta streaming parse error:');
      console.error(err);
    }


    try {
      if (delta.object === "label" || delta.object === "folder") {
        var stageName = delta.event;

        var trialName = null

        if (delta.event === "delete") {
          for (var trialName in adapterData.trialData) {
            var trialData = adapterData.trialData[trialName].rawServerData || {}
            if (trialData.id === delta.id) {
              trialName = trialName;
              break;
            }
          }
          if (!trialName) {
            console.error("XXX> Couldn't find label with ID of ", delta.id)
            return;
          }
        } else if (delta.event === "create") {
          if (!delta.attributes || !delta.attributes.display_name) {
            console.error("XXX> Unknown delta", delta);
            return;
          }
          var trialName = delta.attributes.display_name;
          var parts = trialName.split("\\");
          trialName = parts[parts.length - 1]
          adapterData.trialData[trialName].rawServerData.id = delta.attributes.id
        } else {
          return
        }

        var stageData = adapterData.trialData[trialName][stageName]

        if (!stageData) {
          console.error("XXX> Got a delta for an unknown label", trialName);
        }

        stageData.deltaAt = Date.now();

        var deltaKey = this.currentAdapter.key + "ToDeltaTime";
        stageData[deltaKey] = stageData.deltaAt - stageData.trialStart

        console.log("---> DELTA: "+stage+" Label '"+trialName+"' "+stageData[deltaKey]+" ms since "+currentAdapter.name+" start")
      }
    } catch (err) {
      console.error('Delta streaming parse error:', err);
    }
  }

  TestResults.prototype.onTrialData = function(adapter, action, newTrialData) {
    var data = this.testResults[adapter.key].trialData[action.name]
    data.trialData = Object.assign({}, data.trialData, newTrialData)
  }

  TestResults.prototype.onActionChange = function(adapter, action) {
    var adapterData = this.testResults[adapter.key]

    previousAction = this.currentAction;
    if (previousAction && previousAction.name) {
      var actionData = adapterData[previousAction.name]
      actionData.actionStop = Date.now()
      actionData.actionTime = actionData.actionStop - actionData.actionStart
    }

    this.currentAction = action;
    adapterData[action.name] = {trialData: {}}
    adapterData[action.name].actionStart = Date.now()
  }

  TestResults.prototype.onAdapterChange = function(newAdapter) {
    if (this.currentAdapter && this.currentAdapter.key) {
      this.finalizeAdapter(this.currentAdapter.key)
    }
    this.currentAdapter = newAdapter;
    this.testResults[this.currentAdapter.key] = {}
    this.testResults[this.currentAdapter.key].adapterStart = Date.now()
  }

  TestResults.prototype.finalizeAdapter = function(adapterKey) {
    var avgData = {mean: {}, stdev: {}}
    var adapterData = this.testResults[adapterKey]

    adapterData.adapterStop = Date.now()
    adapterData.adapterTime = adapterData.adapterStop - adapterData.adapterStart

    for (var actionName in adapterData) {
      if (/action/.test(actionName)) { continue }

      if (!avgData.mean[actionName]) {avgData.mean[actionName] = []}
      if (!avgData.stdev[actionName]) {avgData.stdev[actionName] = []}

      for (var trialName in adapterData[actionName].trialData) {
        var time = adapterData[actionName].trialData[trialName].trialTime
        avgData.mean[actionName].push(time)
        avgData.stdev[actionName].push(time)
      }
    }
    for (var actionName in avgData.mean) {
      avgData.mean[actionName] = Math.round(mean(avgData.mean[actionName]))
    }
    for (var actionName in avgData.stdev) {
      avgData.stdev[actionName] = Math.round(stdev(avgData.stdev[actionName]))
    }

    adapterData.avgData = avgData;
    return adapterData
  }

  TestResults.prototype.finalizeTestResults = function() {
    console.log("---> Tests Done!");
    this.testResults.testStop = Date.now();
    this.testResults.testTime = this.testResults.testStop - this.testResults.testStart;
    this.saveToDisk()
  }

  TestResults.prototype.saveToDisk = function() {
    var fname = "N1-stress-test-"+Date.now()+".json"
    fs.writeFileSync(fname, JSON.stringify(this.testResults), {encoding: "utf8"})
    console.log("---> Wrote log to "+fname)
  }

  return TestResults
})();
module.exports = TestResults
