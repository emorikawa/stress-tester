var labelPrefix = require('./config.js').labelPrefix
module.exports = function cleanup(testRunner) {
  if (testRunner.adapterIndex < testRunner.config.adapterKeys.length) {
    return testRunner.loadNextAdapter().then(function(adapter){
      console.log("---> Cleaning up N1-Stress-Test categories on "+adapter.name)
      return adapter.list().then(function(labels) {
        var toDelete = labels.filter(function(labelData){
          var prefixRe = new RegExp(labelPrefix, 'gi')
          return (prefixRe.test(labelData.name))
        })
        console.log("---> Found "+toDelete.length+" categories to delete")
        return Promise.all(toDelete.map(function(labelData) {
          return adapter.deleteLabel(labelData).then(function(){
            console.log("---> DELETED ", labelData.name)
          }).catch(console.error)
        }));
      }).catch(console.error)
    }).then(function(){
      return cleanup(testRunner)
    });
  } else {
    return Promise.resolve()
  }
}
