var nodemailer = require('nodemailer')

module.exports  = function(fromProvider, toProvider) {
  console.log("---> Sending messages from " + fromProvider + " to " + toProvider)

  var To;
  if (toProvider === "Yahoo") To = "etmorikawa@yahoo.com"
  else if (toProvider === "Gmail") To = "n1stresstester@gmail.com"

  var From;
  if (fromProvider === "Yahoo") From = "etmorikawa@yahoo.com"
  else if (fromProvider === "Gmail") From = "n1stresstester@gmail.com"



  var transport = nodemailer.createTransport("SMTP", {
    service: fromProvider,
    auth: {
      user: From,
      pass: "dressingontheside"

    }
  })
  console.log("From: ", From)
  console.log("To: ", To)

  var nums = [0,1,2,3,4]
  return Promise.all(nums.map(function(n){
     return new Promise (function(resolve, reject) {
       transport.sendMail({
      from: "<" + From + ">",
      to: "<" + To + ">",
      subject: "Test #" + n,
      text: "howdy " + n
    }, function(err) {
      if (err) return reject(err)
      else resolve()
      })
    })
  }))

}
