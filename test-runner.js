var TestResults = require('./test-results')

var TestRunner = (function() {
  function TestRunner(config) {
    this.config = config;
    this.adapterIndex = -1;
    this.actionIndex = -1;
    this.currentAdapter = null;
    this.nylasAPI = null;
    this.currentStream = null;
    this.testResults = new TestResults;
    this.labelNames = []
    var now = Date.now();
    for (var i = 0; i < this.config.NUM_LABELS; i++) {
      var labelName = "N1-Stress-Test-" + now + "-" + i;
      this.labelNames.push(labelName);
    }
  }

  TestRunner.prototype.run = function() {
    this.loadNextAdapter()
    .then(this.setupDeltaStream.bind(this))
    .then(this.runNextAction.bind(this));
  };

  TestRunner.prototype.setupDeltaStream = function() {
    var self = this
    return new Promise(function(resolve, reject) {
      if (self.currentStream && self.currentStream.close) {
        self.currentStream.close()
      }
      self.nylasAPI.deltas.latestCursor(function onLatestCursor(err, cursor) {
        if (err) {
          return reject(err)
        }

        self.currentStream = self.nylasAPI.deltas.startStream(cursor, [],
          {exclude_folders: false});
        console.log("---> Listening to Nylas Delta with cursor: "+cursor);
        self.currentStream.on('delta', self.testResults.onDelta.bind(self.testResults)).on('error', function(err) {
          console.error('Delta streaming error:', err);
        });

        resolve()
      })
    })
  }

  TestRunner.prototype.loadNextAdapter = function() {
    this.adapterIndex += 1;
    var adapterName = this.config.adapterNames[this.adapterIndex]
    var requirePath = "./adapters/"+adapterName+".json"

    var nylasTokenForAdapter = require('./credentials.js').nylas[adapterName]
    this.nylasAPI = require('nylas').with(nylasTokenForAdapter)

    try {
      self = this;
      this.currentAdapter = require(requirePath);
      return this.currentAdapter.setup(adapterName).then(function() {
        self.testResults.onAdapterChange(self.currentAdapter)
      })
    } catch (e) {
      this.currentAdapter = null;
      return Promise.reject(new Error("XXX> Can't find "+requirePath));
    }
  }

  TestRunner.prototype.runNextAction = function() {
    this.actionIndex += 1;
    this.currentAction = this.config.actionNames[this.actionIndex]
    this.testResults.onStageChange(this.currentAction);

    console.log("---> "+this.currentAction+" on "+adapter.name);
    var startKey = adapter.key + "Start"
    var endKey = adapter.key + "End"
    var timeKey = adapter.key + "Time"
    var dataKey = adapter.key + "Data"
    this.labelNames.forEach(function(labelName) {
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

  TestRunner.prototype.runAction = function() {

  }

  return TestRunner;
})();
module.exports = TestRunner
