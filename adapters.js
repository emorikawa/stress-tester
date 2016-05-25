module.exports = function(setup) {
  return {
    imap: {
      key: "imap",
      name: "IMAP",
      createLabel: function(name) {
        var p = new Promise(function(resolve, reject) {
          setup.imap.addBox(name, function(err){
            if (err) {return reject(err)}
            else {resolve({name: name})}
          })
        });
        return setup.imap.retryImapIfTimeout(p)
      },
      deleteLabel: function(remoteData) {
        var p = new Promise(function(resolve, reject) {
          setup.imap.delBox(remoteData.name, function(err){
            if (err) {return reject(err)}
            else {resolve()}
          })
        });
        return setup.imap.retryImapIfTimeout(p)
      },
      list: function() {
        var p = new Promise(function(resolve, reject) {
          setup.imap.getBoxes(function(err, boxes){
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
        return setup.imap.retryImapIfTimeout(p)
      },
    },
    nylas: {
      key: "nylasAPI",
      name: "Nylas API",
      createLabel: function(name) {
        var lbl = setup.nylas.labels.build({displayName: name});
        return lbl.save()
      },
      deleteLabel: function(remoteData) {
        return setup.nylas.labels.delete(remoteData.id);
      },
      list: function() {
        return setup.nylas.labels.list({})
      },
    },
    gmail: {
      key: "gmailAPI",
      name: "Gmail API",
      createLabel: function(name) {
        return setup.gmail.users.labels.create({resource: {name: name}})
      },
      deleteLabel: function(remoteData) {
        return setup.gmail.users.labels.delete({id: remoteData.id})
      },
      list: function() {
        return setup.gmail.users.labels.list().then(function(response){
          var data = response.labels.map(function(label) {
            return {
              name: label.name,
              id: label.id,
            }
          })
          return Promise.resolve(data)
        })
      },
    }
  }
}
