var TestRunner = require('./test-runner')
var TestResults = require('./test-results.js')

var testResults = new TestResults()
var testRunner = new TestRunner(require('./config'), testResults);


if (process.argv[2] === "cleanup") {
  require('./cleanup.js')(testRunner).then(function(){
    process.exit()
  })
} else if(process.argv[2] == "send") {
  //to send messages: node main.js send FROM TO -- example: node main.js send Gmail Yahoo
  require('./send.js').sendMessages(process.argv[3], process.argv[4]).then(function(){
    process.exit()
  })
}  else {
  testRunner.run()
  .then(function(){
    testResults.finalizeTestResults();
    process.exit(0)
  })
  .catch(function(){
    testResults.finalizeTestResults();
    process.exit(1)
  })

  process.on('SIGINT', function() {
    testResults.finalizeTestResults();
    process.exit(1);
  });
}
