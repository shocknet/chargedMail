# ChargedMail
### Requirements:
- Google Cloud Project 
- Gmail API Key
- Google Cloud PubSub API key
- Set LND host in lnd.js line 15
- Node 12

### Required extra files
private/creds.json: file with the API key for GMAIL
private/credsPubSub.json: file with the API key for GC PubSub
private/projectInfo.json: info in GCP project must contain:"ProjectId","topicName","pullSubName"

private/tls.cert:tls certificate for lnd
private/admin.macaroon: macaroon file for lnd
private/rpc.proto: proto file for the Lnd grpc

#### Ensure that these files are put into /private prior to starting. The private folder will be where the user token and internal database will be stored. 

### GMail Filters

For emails you wish to receive the paywall challenge, create a filter to add the `Unpaid` label to them, and archive them away from your inbox. Also, create the label `Paid`, which will be applied once the paywall is satisfied, as well as `Inbox`, `Unread` and `Starred`.

### Run
`npm start`, then connect to the web panel at http://localhost:8254/ to define your outgoing message, cost and initialize the service.