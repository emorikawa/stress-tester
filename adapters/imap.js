var fs = require('fs');
var path = require('path');
var configDir = path.join(process.env.HOME, ".credentials")

var Imap = require('imap')
var imap = new Imap(require(path.join(configDir, "imap.json")));

imap.NYLAS_TIMEOUT = 5000;
function imapConnect() {
  return new Promise(function(resolve, reject) {
    var timedOut = false;
    setTimeout(function(){
      timedOut = true;
      reject(new Error("IMAP timed out while trying to connect"))
    }, imap.NYLAS_TIMEOUT)
    imap.destroy();
    imap.once('ready', function(){
      if (timedOut) {return}
      else {resolve()}
    })
    imap.once('error', reject)
    imap.connect();
  });
}

NUM_RETRIES = 1
function retryImapIfTimeout(tryPromise, attempt) {
  attempt = attempt || 0
  return new Promise(function(resolve, reject) {
    var timedOut = false;

    var t = setTimeout(function(){
      timedOut = true;
      if (attempt >= NUM_RETRIES) {
        reject(new Error("After retrying to connect, IMAP still timed out."))
      } else {
        console.log("Imap timed out. Retrying to connect…");
        imapConnect().then(function(){
          retryImapIfTimeout(tryPromise, 1).then(resolve).catch(reject)
        }).catch(reject)
      }
    }, imap.NYLAS_TIMEOUT)

    tryPromise.then(function(arg){
      if(!timedOut) {
        clearTimeout(t);
        resolve(arg)
      }
    }).catch(function(err){
      if(!timedOut) {
        clearTimeout(t);
        reject(err)
      }
    })
  })
}

module.exports = {
  key: "imap",
  name: "IMAP",
  setup: function() {
    return imapConnect()
  },
  createLabel: function(name) {
    var p = new Promise(function(resolve, reject) {
      imap.addBox(name, function(err){
        if (err) {return reject(err)}
        else {resolve({name: name})}
      })
    });
    return retryImapIfTimeout(p)
  },
  deleteLabel: function(remoteData) {
    var p = new Promise(function(resolve, reject) {
      imap.delBox(remoteData.name, function(err){
        if (err) {return reject(err)}
        else {resolve()}
      })
    });
    return retryImapIfTimeout(p)
  },
  updateLabel: function(newName, remoteData) {
    var p = new Promise(function(resolve, reject){
      imap.renameBox(remoteData.name, newName, function(err){
        if (err) {return reject(err)}
        else {resolve()}
      })
    })
    return retryImapIfTimeout(p)
  },
  list: function() {
    var p = new Promise(function(resolve, reject) {
      imap.getBoxes(function(err, boxes){
        var folders = []
        if (err) { return reject(err) }
        for (var folderName in boxes) {
          folders.push({
            name: folderName,
            id: folderName
          })
        }
        return resolve(folders)
      });
    });
    return retryImapIfTimeout(p)
  },
}
