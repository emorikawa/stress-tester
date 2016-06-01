var lastStream = null

var TestRunner = (function() {
  function TestRunner(config, testResults) {
    this.config = config;
    this.adapterIndex = -1;
    this.testResults = testResults;
  }

  TestRunner.prototype.runNextAdapter = function() {
    this.actionIndex = -1;
    return this.loadNextAdapter()
    .then(this.setupDeltaStream.bind(this))
    .then(this.runNextAction.bind(this));
  };

  TestRunner.prototype.setupDeltaStream = function(adapter) {
    if (!adapter) { return Promise.resolve() }
    var self = this

    nylasAdapter = require("./adapters/nylas.js")
    return nylasAdapter.setup(adapter.key).then(function(token) {
      return Promise.resolve(require('nylas').with(token))
    }).then(function(nylasAPI) {
      return new Promise(function(resolve, reject){
        if (lastStream && lastStream.close) { lastStream.close() }

        nylasAPI.deltas.latestCursor(function(err, cursor) {
          if (err) { return reject(err) }

          var stream = nylasAPI.deltas.startStream(cursor, [],
            {exclude_folders: false});

          var msg = "---> Listening to Nylas Delta with cursor: "+cursor
          console.log(msg);

          var onDelta = self.testResults.onDelta.bind(self.testResults)
          stream.on('delta', onDelta).on('error', function(err) {
            console.error('Delta streaming error:', err);
          });

          lastStream = stream;
          return resolve(stream)
        })
      })
    }).then(function(){
      return Promise.resolve(adapter)
    });
  }

  /**
   * Calls `setup` on the next adapter.
   *
   * Resolves with the new adapter
   */
  TestRunner.prototype.loadNextAdapter = function() {
    this.adapterIndex += 1;
    var self = this;
    var adapterKey = this.config.adapterKeys[this.adapterIndex]
    if (!adapterKey) {
      return Promise.resolve()
    } else {
      var requirePath = "./adapters/"+adapterKey+".js"
      try {
        var adapter = require(requirePath);
        return adapter.setup(adapterKey).then(function() {
          self.testResults.onAdapterChange(adapter);
          return Promise.resolve(adapter)
        })
      } catch (e) {
        return Promise.reject(new Error("XXX> Can't find "+requirePath));
      }
    }
  }

  TestRunner.prototype.waitForDeltas = function(adapter, action) {
    self = this;
    return new Promise(function(resolve, reject) {
      var tint = setInterval(function(){
        var data = self.testResults[adapter.key][action.name].trialData;
        for (var trialName in data) {
          if (!data[trialName].deltaTime) { return }
        }
        clearTimeout(tout)
        clearInterval(tint)
        return resolve()
      }, 10)

      var tout = setTimeout(function() {
        clearInterval(tint)
        var err = new Error("XXX> Action "+action.name+" timed out waiting for deltas")
        reject(err)
      }, self.config.actionTimeout)
    })
  }

  TestRunner.prototype.runNextAction = function(adapter) {
    this.actionIndex += 1;
    var action = this.config.actions[this.actionIndex]
    if (action) {
      this.testResults.onActionChange(adapter, action);

      var adapterDataClone = Object.assign({}, this.testResults[adapter.key])

      self = this;
      var onTrialData = function(trialData) {
        self.testResults.onTrialData(adapter, action, trialData)
      }
      return action(adapter, onTrialData, adapterDataClone, this.config)
      .then(function() {
        return self.waitForDeltas(adapter, action)
      }).then(function(){
        return self.runNextAction(adapter)
      }).catch(function(err){
        console.error("XXX> Action "+action.name+" had an error");
        console.error(err)
        return self.runNextAction(adapter)
      })

    } else {
      return this.runNextAdapter()
    }
  }

  return TestRunner;
})();
module.exports = TestRunner
