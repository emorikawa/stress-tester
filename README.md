# N1 Stress Tester

## Setup
1. Go to https://developers.google.com/oauthplayground and get an API
   token for Gmail API v1 all mail (https://mail.google.com). Be sure to
   check folder access as well.
2. Create a `~/.credentials/gmail.json` that looks like:

        {
          "access_token":"YOUR ACCESS TOKEN",
          "refresh_token":"YOUR REFRESH TOKEN",
        }

3. Create a `~/.credentials/imap.json` that looks like:

        {
          "user": "YOUR EMAIL",
          "password": "YOUR PASS",
          "host": "IMAP HOST",
          "port": 993,
          "tls": true
        }

4. Create a `~/.credentials/nylas.json`. Grab a token from the N1 worker
   window or auth it yourself. The file should look like:

        {
          "token": "YOUR NYLAS API TOKEN"
        }

5. `npm install`
6. `node main.js`
