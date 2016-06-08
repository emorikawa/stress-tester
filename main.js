var TestRunner = require('./test-runner')
var TestResults = require('./test-results.js')

var testResults = new TestResults()
var testRunner = new TestRunner(require('./config'), testResults);

if (process.argv[2] === "cleanup") {
  require('./cleanup.js')(testRunner).then(function(){
    process.exit()
  })
} else {
  testRunner.run()
  .then(function(){
    process.exit(0) })
  .catch(function(){
    testResults.finalizeTestResults();
    process.exit(1)
  })

  process.on('SIGINT', function() {
    testResults.finalizeTestResults();
    process.exit(1);
  });
}
