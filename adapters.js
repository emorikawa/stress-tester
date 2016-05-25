module.exports = function(setup) {
  return {
    nylas: {
      key: "nylasAPI",
      name: "Nylas API",
      createLabel: function(name) {
        var lbl = setup.nylas.labels.build({displayName: name});
        return lbl.save()
      },
      deleteLabel: function(id) {
        return setup.nylas.labels.delete(id);
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
      deleteLabel: function(id) {
        return setup.gmail.users.labels.delete({id: id})
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
