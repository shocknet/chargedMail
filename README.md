# ChargedMail
### Requirements:
- Google Cloud Project 
- Gmail API Key
- Google Cloud PubSub API key
- Set LND host in lnd.js line 15
- Node 12

### Required  Files
- `private/creds.json`: Authentication File for GMail API
- `private/credsPubSub.json`: Authentication File for GC PubSub
- `private/projectInfo.json`: PubSub Namings

- `private/tls.cert`: LND Cert
- `private/admin.macaroon`: Authentication file for LND
- `private/rpc.proto`:  LNRPC

#### Ensure that these files are put into /private prior to starting. The private folder will be where the user token and internal database will be stored. 

### GMail Filters

For emails you wish to receive the paywall challenge, create a filter to add the `Unpaid` label to them, and archive them away from your inbox. Also, create the label `Paid`, which will be applied once the paywall is satisfied, as well as `Inbox`, `Unread` and `Starred`.

### Run
`npm start`, then connect to the web panel at http://localhost:8254/ to define your outgoing message, cost and initialize the service.
