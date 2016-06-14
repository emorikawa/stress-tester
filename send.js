var nodemailer = require('nodemailer')
var subj = "Move # "


module.exports

var sending  = function(fromProvider, toProvider) {
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

  var nums = Array.from({length: 20}, (v, k) => k);  
  return Promise.all(nums.map(function(n){
     return new Promise (function(resolve, reject) {
       transport.sendMail({
      from: "<" + From + ">",
      to: "<" + To + ">",
      subject:  + n,
      text: "hi "+ n
    }, function(err) {
      if (err) return reject(err)
      else resolve()
      })
    })
  }))

}
module.exports = {
  sendMessages: sending,
  subject: subj
}
