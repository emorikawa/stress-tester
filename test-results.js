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
       nylasIdLookup:
        "N1-Stress-Test-00000" : nylasId
 *     createLabel: (action.key)
 *       trialData:
 *         "N1-Stress-Test-00000-1": (trialName)
 *           rawServerData:
 *             id: number,
 *             ...
 *           trialStart: timestamp
 *           trialStop: timestamp
 *           trialTime: number
 *           deltaAt: timestamp
 *           deltaTime: number
 *         "N1-Stress-Test-00000-2": (trialName)
 *           ...
 *         "N1-Stress-Test-00000-3": (trialName)
 *           ...
 *         ... (trialName)
 *       actionStart: timestamp
 *       actionStop: timestamp
 *       actionTime: number
 *     updateLabel: (action.key)
 *       ...
 *     deleteLabel: (action.key)
 *       ...
 *     ... (action.key)
 *     avgData:
 *       createLabel: (action.key)
 *         mean: number
 *         stdev: number
 *       updateLabel: (action.key)
 *         ...
 *       deleteLabel: (action.key)
 *         ...
 *       ...
 *     adapterStart: timestamp
 *     adapterStop: timestamp
 *     adapterTime: number
 *   imap: (adapter.key)
 *     ...
 *   outlook: (adapter.key)
 *     ...
 *   nylas: (adapter.key)
 *     ...
 *   ... (adapter.key)
 *   testStart: timestamp
 *   testStop: timestamp
 *   testTime: number
 */
var TestResults = (function() {
  function TestResults() {
    this.testResults = {}
    this.currentAdapter = null
    this.currentAction = null
    this.testResults.testStart = Date.now()
  }

  TestResults.prototype.onDelta = function(delta) {
    if (!delta) {
      console.error("XXX> Malformed delta", delta)
      return;
    }
    if (!this.currentAction.isMatchingDelta(delta)) {
      return;
    }
    var trialData = this.testResults[this.currentAdapter.key][this.currentAction.key].trialData
    var trialKey = this.currentAction.trialKeyFromDelta(delta, this.testResults[this.currentAdapter.key]["nylasIdLookup"]);
    if(delta.event === "create"){
      if (trialKey && delta.attributes && delta.attributes.id) {
        this.testResults[this.currentAdapter.key]["nylasIdLookup"][trialKey] = {
          nylasId: delta.attributes.id,
          newName: trialKey
        }
      }
    }
    if(delta.event === "modify" && delta.attributes && trialKey) {
      this.testResults[this.currentAdapter.key]["nylasIdLookup"][trialKey].newName = delta.attributes.display_name
    }

    if(trialKey){
      var now = Date.now();
      trialData[trialKey].deltaAt = now
      trialData[trialKey].deltaTime = now - trialData[trialKey].trialStart
      console.log("**** DELTA: "+this.currentAction.key+" '"+trialKey+"' "+trialData[trialKey].deltaTime+" ms since "+this.currentAdapter.key+" start")
    }
  }


  TestResults.prototype.waitForDeltas = function(adapter, action, actionTimeout) {
    //dont wait for move message deltas
    if (action.key === "moveMessage") return;
    var self = this;
    return new Promise(function(resolve, reject) {
      var tint = setInterval(function(){
        var data = self.testResults[adapter.key][action.key].trialData;
        for (var trialName in data) {
          if (!data[trialName].deltaTime) { return }
        }
        clearTimeout(tout)
        clearInterval(tint)
        return resolve()
      }, 10)

      var tout = setTimeout(function() {
        clearInterval(tint)
        var err = new Error("XXX> Action "+action.key+" timed out waiting for deltas")
        reject(err)
      }, actionTimeout)
    })

  }

  TestResults.prototype.onTrialData = function(adapter, action, newTrialData) {
    var data = this.testResults[adapter.key][action.key]
    data.trialData = Object.assign({}, data.trialData, newTrialData)
  }

  TestResults.prototype.onActionChange = function(adapter, action) {
    var adapterData = this.testResults[adapter.key]

    previousAction = this.currentAction;
    if (previousAction && previousAction.key) {
      var actionData = adapterData[previousAction.key]
      actionData.actionStop = Date.now()
      actionData.actionTime = actionData.actionStop - actionData.actionStart
    }

    this.currentAction = action;
    adapterData[action.key] = {trialData: {}}
    adapterData[action.key].actionStart = Date.now()
  }

  TestResults.prototype.onAdapterChange = function(newAdapter) {
    if (this.currentAdapter && this.currentAdapter.key) {
      this.finalizeAdapter(this.currentAdapter.key)
    }
    this.currentAdapter = newAdapter;
    this.testResults[this.currentAdapter.key] = {}
    this.testResults[this.currentAdapter.key]["nylasIdLookup"] = {}
    this.testResults[this.currentAdapter.key].adapterStart = Date.now();
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
        var time = adapterData[actionName].trialData[trialName].deltaTime;
        if (!time) { continue }
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
    if (this.errors) {
      this.testResults.errors = this.errors.map(function(err){
        return { message: err.message, stack: err.stack }
      })
    }
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
