This project was created for and [placed in the Strike Lightning Hackathon](https://medium.com/radartech/announcing-strike-hackathon-winners-5a4895708746), see the [devpost submission](https://devpost.com/software/charged-mail).

![chargedMail Logo](https://github.com/shocknet/chargedMail/raw/master/public/chargedMail.png)

# ChargedMail
### Requirements:
- Google Cloud Project 
- Gmail API Key
- Google Cloud PubSub API key
- Node 12
- LND or LNBits

LNBits Key can be provided via the interface

### Required  Files (LND)
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
`npm start`, then connect to the web panel at http://localhost:8254/ to define your outgoing message, cost, and initialize the service.


#### Tips :)

3K3tKywVy2m29teR52XAMEjZ6Rs3ZLdTxc

![Tips Welcome](https://github.com/shocknet/chargedMail/blob/master/tips.png)
