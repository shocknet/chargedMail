module.exports.initDB =  function (callback){
    const sqlite3 = require('sqlite3').verbose();

    let db = new sqlite3.Database('./private/cMail.db',sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
        if (err) {
            console.error(err.message);
            return
        }
        console.log('Connected to the chinook database.');
        createTable(db)
    });
    
    function createTable(db){
        db.run("CREATE TABLE IF NOT EXISTS payments ("+
        "message_id TEXT PRIMARY KEY,"+
        "local_email TEXT NOT NULL,"+
        "remote_email TEXT NOT NULL,"+
        "subject TEXT NOT NULL,"+
        "thread_id TEXT NOT NULL,"+
        "time_generated TEXT NOT NULL,"+
        'time_paid TEXT DEFAULT "",'+
        'pay_req TEXT DEFAULT "",'+
        'pay_addr TEXT DEFAULT "",'+
        'tx_id TEXT DEFAULT "",'+
        'pre_image TEXT DEFAULT "",'+
        'amount INTEGER DEFAULT ""'+
        ") WITHOUT ROWID;",err => {
            console.log(err)
            if(!err && callback){
                callback(db)
            }
        })
    }
}
module.exports.addMail = function(gmail,lightning,db,to,from,subject,messageId,threadId,optionD){
    console.log("LN")
    //console.log(lightning)
    console.log("adding maill......")
    db.all(' SELECT * FROM payments WHERE message_id = "'+messageId+'" AND time_paid = "";',[],(err,res) => {
        if(err){
            console.log("exist error: " +err)
        } else {
            console.log(res.length)
            if(res.length == 0){
                console.log("didnt find any correspondi to this email")
                var timeNow = Date.now().toString()
                    db.run('INSERT INTO payments '+
                    '(message_id,local_email,remote_email,subject,thread_id,time_generated) '+
                    'VALUES ("'+messageId+'","'+to+'","'+from+'","'+subject+'","'+threadId+'","'+timeNow+'");', err =>{
                        if(err){
                            console.log("insert error: "+err)
                            return
                        }
                        var localLND = require("./lnd.js")
                        localLND.addInvoice(lightning,"pay to unlock email",1000,res=>{
                            let data = ['Ansi C', 'C'];
                            let sql = `UPDATE langs
                                        SET name = ?
                                        WHERE name = ?`;
                            db.run('UPDATE payments '+
                                    'SET pay_req = "'+res.payment_request+'",pay_addr="'+res.fallback_addr+'" WHERE message_id="'+messageId+'";', err =>{
                                        if(err){
                                            console.log(err)
                                            return
                                        }
                                        var payment_request= res.payment_request
                                        var fallback_addr = res.fallback_addr
                                        var data =optionD.message+ " \n "+
                                        "cost: "+optionD.cost+"\n\n"+
                                        "via LN:"+res.payment_request+
                                        "\n on-Chain:"+res.fallback_addr+"\n\n"
                                        var localGmail = require("./gmail.js")
                                        localGmail.sendEmail(gmail,to,from,messageId,threadId,subject,data)
                                    })
                            
                        })
                        
                    })
                
                
            }else{
                console.log("found element coorespondig to mex id")
            }
        }
    })
}

module.exports.handlePayment=function(gmail,db,pay_req,addr,r_preimage,tx_hash,amount,optionD){
    if(pay_req != ""){
        console.log("handle pay from invoice")
        db.all(' SELECT * FROM payments WHERE pay_req = "'+pay_req+'";',[],(err,res) => {
            if(err){
                console.log("exist listen error: " +err)
            } else {
                if(res.length == 1){
                    var timeNow = Date.now().toString()
                    console.log(res[0])
                    db.run('UPDATE payments '+
                            'SET pre_image = "'+r_preimage+'",'+'amount = '+amount+',time_paid="'+timeNow+'" WHERE message_id="'+res[0].message_id+'";', err =>{
                            if(err){
                                console.log("update listen error: " +err)
                            } else {
                                require("./gmail").SetAsPaid(gmail,res[0].message_id,optionD,res =>{
                                    console.log("updated paid invoice")
                                    console.log(res)
                                })
                            }
                        })
    
                }
            }
        })
        return
    }
    if(addr != ""){
        console.log("handle pay from tx")
        db.all(' SELECT * FROM payments WHERE pay_addr = "'+addr+'";',[],(err,res) => {
            if(err){
                console.log("exist listen error: " +err)
            } else {
                console.log("res on chain")
                console.log(res)
                if(res.length == 1){
                    var timeNow = Date.now().toString()
                    console.log(res[0])
                    db.run('UPDATE payments '+
                            'SET tx_id = "'+tx_hash+'",'+'amount = '+amount+',time_paid="'+timeNow+'" WHERE message_id="'+res[0].message_id+'";', err =>{
                            if(err){
                                console.log("update listen error: " +err)
                            } else {
                                require("./gmail").SetAsPaid(gmail,res[0].message_id,optionD,res =>{
                                    console.log("updated paid invoice")
                                    console.log(res)
                                })
                            }
                        })
    
                }
            }
        })
        return
    }
}
