const fetch = require('node-fetch')
module.exports.init=function(lndAddress,lnbitsKey){
    if(lnbitsKey){return}
    var fs = require('fs');
    var grpc = require('@grpc/grpc-js');
    var lnrpc = grpc.load('private/rpc.proto').lnrpc;
    process.env.GRPC_SSL_CIPHER_SUITES = 'HIGH+ECDSA'
    var lndCert = fs.readFileSync('private/tls.cert');
    var sslCreds = grpc.credentials.createSsl(lndCert);
    var macaroonCreds = grpc.credentials.createFromMetadataGenerator(function(args, callback) {
        var macaroon = fs.readFileSync("private/admin.macaroon").toString('hex');
        var metadata = new grpc.Metadata()
        metadata.add('macaroon', macaroon);
        callback(null, metadata);
    });
    var creds = grpc.credentials.combineChannelCredentials(sslCreds, macaroonCreds);
    var lightning = new lnrpc.Lightning(lndAddress, creds);
    /*var request = {} 
    lightning.getInfo(request, function(err, response) {
        console.log(err)
        console.log(response);
    })*/
    return lightning
}

module.exports.addInvoice=function(lightning,optionD,callback){
    const {cost:value, message:memo,lnbitsKey,lnbitsUrl } = optionD
    if (lnbitsKey) {
        fetch(`${lnbitsUrl}/api/v1/payments`, {
            method: 'POST',
            headers: {
            'Content-Type': 'application/json',
            'X-Api-Key':lnbitsKey
            },
            body: JSON.stringify({out: false, amount: 420, memo: "mem"}) // body data type must match "Content-Type" header
        }).then(res => {
            return res.json()
        }).then(res => {
            callback(res)
        })
        return 
    }

    var request = { 
        type: 0, 
    } 
    lightning.newAddress(request, function(err, response) {
        if(err){
            console.log(err)
            return
        }
        //console.log(response);
        var resAddr = response.address
        //console.log(resAddr)
        console.log("creating invoice----------")
        var request = {
            memo:memo,
            value:value,
            fallback_addr:resAddr

        }
        lightning.addInvoice(request, function(err, response) {
            if(err){
                console.log(err)
                return
            }
            console.log(response);
            response.fallback_addr = resAddr
            callback(response)
        })
    })

    
}

module.exports.listenInvoice= function(gmail,lightning,db,optionD){
    var localDB = require("./db.js")
    const {lnbitsKey,lnbitsUrl } = optionD
    if (lnbitsKey) {
        const es = new EventSource(`${lnbitsUrl}/api/v1/payments/sse?api-key=${lnbitsKey}`)
        es.addEventListener("payment-received", function(e) {
            const {data} = e
            localDB.handlePayment(gmail,db,data.bolt11,"",data.preimage,"",data.amount/1000,optionD)
        })
        es.addEventListener("error", function(e) {
        console.log(e)
        })
        return 
    }
    var request = { 
		settle_index: 1, 
	} 
    var call = lightning.subscribeInvoices(request)
    console.log("listening invoce:")
	call.on('data', function(response) {
		// A response was received from the server.
        //console.log(response);
        
        if(response.settled){
            localDB.handlePayment(gmail,db,response.payment_request,"",response.r_preimage,"",response.amt_paid,optionD)
        }
        
	});
	call.on('status', function(status) {
		// The current status of the stream.
	});
	call.on('end', function() {
		// The server has closed the stream.
	});
}
module.exports.listenTransaction = function(gmail,lightning,db,optionD){
    var localDB = require("./db.js")
    const {lnbitsKey } = optionD
    if (lnbitsKey) {
        return 
    }

    var request = {} 
    var call = lightning.subscribeTransactions(request)
    call.on('data', function(response) {
        // A response was received from the server.
        //console.log(response);
        console.log("got something on chain")
        //console.log(response.amount)
        //console.log(optionD.cost)
        //console.log(response.num_confirmations)
        if(response.amount >= optionD.cost && response.num_confirmations >= 1){
            localDB.handlePayment(gmail,db,"",response.dest_addresses[0],"",response.tx_hash,response.amount,optionD)
        }
    });
    call.on('status', function(status) {
        // The current status of the stream.
    });
    call.on('end', function() {
        // The server has closed the stream.
    });
}