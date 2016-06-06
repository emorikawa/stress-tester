var lastStream = null

var TestRunner = (function() {
  function TestRunner(config, testResults) {
    this.config = config;
    this.adapterIndex = -1;
    this.testResults = testResults;
    this.errors = []
  }

  TestRunner.prototype.run = function() {
    var self = this;
    return new Promise(function(resolve, reject) {
      var notifyErrors = function(){
        self.testResults.errors = self.errors;
        console.error("XXX> Error running tests");
        self.errors.forEach(console.error)
        reject(self.errors)
      }

      self.runNextAdapter().then(function(){
        if (self.errors.length > 0) {
          notifyErrors()
        } else {
          resolve()
        }
      }).catch(function(err){
        self.errors.push(err)
        notifyErrors()
      })
    })
  }

  TestRunner.prototype.runNextAdapter = function() {
    this.actionIndex = -1
    return this.loadNextAdapter()
    .then(this.setupDeltaStream.bind(this))
    .then(this.runNextAction.bind(this));
  };

  TestRunner.prototype.setupDeltaStream = function(adapter) {
    if (!adapter) { return Promise.resolve() }
    var self = this;

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
        self.errors.push(e)
        return Promise.reject(new Error("XXX> Can't find "+requirePath));
      }
    }
  }

  TestRunner.prototype.runNextAction = function(adapter) {
    if (!adapter) { return Promise.resolve() }
    var self = this;
    this.actionIndex += 1;
    var action = this.config.actions[this.actionIndex]
    if (action) {
      this.testResults.onActionChange(adapter, action);

      var adapterDataClone = Object.assign({}, this.testResults[adapter.key])

      var onTrialData = function(trialData) {
        self.testResults.onTrialData(adapter, action, trialData)
      }
      return action(adapter, onTrialData, adapterDataClone, this.config)
      .then(function() {
        return self.testResults.waitForDeltas(adapter, action, self.config.actionTimeout)
      }).then(function(){
        return self.runNextAction(adapter)
      }).catch(function(err){
        console.error("XXX> Action "+action.key+" had an error");
        self.errors.push(err)
        return self.runNextAction(adapter)
      })

    } else {
      return this.runNextAdapter()
    }
  }

  return TestRunner;
})();
module.exports = TestRunner
