module.exports = function(setup) {
  return {
    nylas: {
      key: "nylasAPI",
      name: "Nylas API",
      createLabel: function(name) {

      },
      deleteLabel: function(id) {

      }
    },
    gmail: {
      key: "gmailAPI",
      name: "Gmail API",
      createLabel: function(name) {
        return setup.gmail.users.labels.create({resource: {name: name}})
      },
      deleteLabel: function(id) {
        return setup.gmail.users.labels.delete({id: id})
      }
    }
  }
}
