var credentials = require('./credentials.js');
var nylas = require('nylas').with(credentials.nylas.token)
var gmail = require('googleapis').gmail('v1');

Object.keys(gmail.users.labels).forEach(function(key) {
  var origFn = gmail.users.labels[key]
  var newFn = function(arg) {
    return new Promise(function(resolve, reject) {
      var newArg = Object.assign({}, credentials.gmail, arg)
      origFn(newArg, function(err, response) {
        if (err) { return reject(err) }
        return resolve(response)
      })
    })
  }
  gmail.users.labels[key] = newFn
})

function getCursor() {
  return new Promise(function(resolve, reject) {
    nylas.deltas.latestCursor(function onLatestCursor(err, cursor) {
      if (err) {
        return reject(err)
      }
      return resolve(cursor)
    })
  })
}

function setup() {
  return getCursor().then(function(cursor) {
    return Promise.resolve({
      cursor: cursor,
      gmail: gmail,
      nylas: nylas,
    })
  })
}

module.exports = setup;
