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

var TestResults = (function() {
  function TestResults() {
    this.init()
  }

  TestResults.prototype.init = function(delta) {
    this.testResults = {}
    this.currentAdapter = null
    this.currentStageName = null
    this.testResults.testStart = Date.now()
  }

  TestResults.prototype.onDelta = function(delta) {
    var adapterData = this.testResults[this.currentAdapter.key]
    try {
      if (delta.object === "label" || delta.object === "folder") {
        var stageName = delta.event;
        // if (STAGES.indexOf(delta.event) === -1) {
        //   console.error("XXX> Unsupported delta event", delta.event, delta);
        //   return;
        // }

        var labelName = null
        var dataKey = this.currentAdapter.key + "Data"

        if (delta.event === "delete") {
          for (var labelName in adapterData.labelData) {
            var labelData = adapterData.labelData[labelName][dataKey] || {}
            if (labelData.id === delta.id) {
              labelName = labelName;
              break;
            }
          }
          if (!labelName) {
            console.error("XXX> Couldn't find label with ID of ", delta.id)
            return;
          }
        } else if (delta.event === "create") {
          if (!delta.attributes || !delta.attributes.display_name) {
            console.error("XXX> Unknown delta", delta);
            return;
          }
          var labelName = delta.attributes.display_name;
          var parts = labelName.split("\\");
          labelName = parts[parts.length - 1]
          adapterData.labelData[labelName][dataKey].id = delta.attributes.id
        } else {
          return
        }

        var stageData = adapterData.labelData[labelName][stageName]

        if (!stageData) {
          console.error("XXX> Got a delta for an unknown label", labelName);
        }

        stageData.deltaAt = Date.now();

        var deltaKey = currentAdapter.key + "ToDeltaTime";
        var startKey = currentAdapter.key + "Start"
        stageData[deltaKey] = stageData.deltaAt - stageData[startKey]

        console.log("---> DELTA: "+stage+" Label '"+labelName+"' "+stageData[deltaKey]+" ms since "+currentAdapter.name+" start")
      }
    } catch (err) {
      console.error('Delta streaming parse error:', err);
    }
  }

  TestResults.prototype.onStageChange = function(newStage) {
    this.currentStageName = newStage
  }

  TestResults.prototype.onAdapterChange = function(newAdapter) {
    this.currentAdapter = newAdapter
  }

  TestResults.prototype.finalizeAdapter = function(newAdapter) {
    var avgData = {mean: {}, stdev: {}}
    var adapterData = this.testResults[this.currentAdapter.key]

    for (var labelName in adapterData.labelData) {
      for (var stageName in adapterData.labelData[labelName]) {
        for (var stageStat in adapterData.labelData[labelName][stageName]) {
          if (/Time/.test(stageStat)) {
            var key = stageName+" "+stageStat
            if (!avgData.mean[key]) {avgData.mean[key] = []}
            if (!avgData.stdev[key]) {avgData.stdev[key] = []}
            avgData.mean[key].push(adapterData.labelData[labelName][stageName][stageStat])
            avgData.stdev[key].push(adapterData.labelData[labelName][stageName][stageStat])
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

    adapterData.avgData = avgData;
    return adapterData
  }

  TestResults.prototype.finalize = function() {
    console.log("---> Tests Done!");
    this.testResults.testStop = Date.now();
    this.testResults.testTime = this.testResults.testStop - this.testResults.testStart;
  }

  TestResults.prototype.saveToDisk = function() {
    var fname = "N1-stress-test-"+Date.now()+".json"
    fs.writeFileSync(fname, JSON.stringify(this.testResults), {encoding: "utf8"})
    console.log("---> Wrote log to "+fname)
  }

  return TestResults
})();
module.exports = TestResults
