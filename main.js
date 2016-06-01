var TestRunner = require('./test-runner')
var TestResults = require('./test-results.js')

var testResults = new TestResults()
var testRunner = new TestRunner(require('./config'), testResults);

if (process.argv[2] === "cleanup") {
  require('./cleanup.js')(testRunner).then(function(){
    process.exit()
  })
} else {
  testRunner.runNextAdapter()
  .then(testResults.finalizeTestResults.bind(testResults))
  .catch(function(err){
    console.error("XXX> Error running tests")
    console.error(err)
    testResults.finalizeTestResults.bind(testResults)()
  })

  process.on('SIGINT', function() {
    testResults.finalizeTestResults();
    process.exit();
  });
}

