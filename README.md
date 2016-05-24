# N1 Stress Tester

## Setup
1. Go to https://developers.google.com/oauthplayground and get an API
   token for Gmail API v1 all mail (https://mail.google.com)
2. Create a `~/.credentials/gmail-token.json` that looks like:
        {
          "access_token":"YOUR ACCESS TOKEN",
          "token_type":"Bearer",
          "refresh_token":"YOUR REFRESH TOKEN",
          "expiry_date":YOUR EXPIRY DATE
        }
3. Open the worker window.
