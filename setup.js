var credentials = require('./credentials.js');
// var gmail = require('googleapis').gmail('v1');
// var Imap = require('imap')

// var imap = new Imap(credentials.imap);

// Object.keys(gmail.users.labels).forEach(function(key) {
//   var origFn = gmail.users.labels[key]
//   var newFn = function(arg) {
//     return new Promise(function(resolve, reject) {
//       var newArg = Object.assign({}, credentials.gmail, arg)
//       origFn(newArg, function(err, response) {
//         if (err) { return reject(err) }
//         return resolve(response)
//       })
//     })
//   }
//   gmail.users.labels[key] = newFn
// })

// var outlook = require('node-outlook')
// Object.keys(outlook.mail).forEach(function(key) {
//   var origFn = outlook.mail[key]
//   var newFn = function(arg) {
//     return new Promise(function(resolve, reject) {
//       var newArg = Object.assign({}, {token: credentials.outlook.token}, arg)
//       origFn(newArg, function(err, response) {
//         if (err) { return reject(err) }
//         return resolve(response)
//       })
//     })
//   }
//   outlook.mail[key] = newFn
// })
// outlook.FOLDER_PARAMS = {
//   token: credentials.outlook.token,
//   baseUrl: "https://outlook.office.com/api/v2.0/me/MailFolders",
// }


// imap.NYLAS_TIMEOUT = 5000;
// function imapConnect() {
//   return new Promise(function(resolve, reject) {
//     var timedOut = false;
//     setTimeout(function(){
//       timedOut = true;
//       reject(new Error("IMAP timed out while trying to connect"))
//     }, imap.NYLAS_TIMEOUT)
//     imap.destroy();
//     imap.once('ready', function(){
//       if (timedOut) {return}
//       else {resolve()}
//     })
//     imap.once('error', reject)
//     imap.connect();
//   });
// }
//
// NUM_RETRIES = 1
// function retryImapIfTimeout(tryPromise, attempt) {
//   attempt = attempt || 0
//   return new Promise(function(resolve, reject) {
//     var timedOut = false;
//
//     var t = setTimeout(function(){
//       timedOut = true;
//       if (attempt >= NUM_RETRIES) {
//         reject(new Error("After retrying to connect, IMAP still timed out."))
//       } else {
//         console.log("Imap timed out. Retrying to connect…");
//         imapConnect().then(function(){
//           retryImapIfTimeout(tryPromise, 1).then(resolve).catch(reject)
//         }).catch(reject)
//       }
//     }, imap.NYLAS_TIMEOUT)
//
//     tryPromise.then(function(arg){
//       if(!timedOut) {
//         clearTimeout(t);
//         resolve(arg)
//       }
//     }).catch(function(err){
//       if(!timedOut) {
//         clearTimeout(t);
//         reject(err)
//       }
//     })
//   })
// }
// imap.retryImapIfTimeout = retryImapIfTimeout

function setup() {
  return imapConnect().then(function() {
    return Promise.resolve({
      // imap: imap,
      // gmail: gmail,
      // outlook: outlook,
    })
  })
}

module.exports = setup;
