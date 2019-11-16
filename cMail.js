var status = {
	status:"NOT running"
}
module.exports.getStatus=function(){
	return {...status,...optionD_G}
}
var optionD_G = {}
module.exports.startD=function(gmail,optionD = {
	cost:1000,
	message:"please play this message to deliver the message"
}){
	var optionD_G = optionD
	status.status = "starting"
	const {google} = require('googleapis');
	const fs = require('fs');
	var projectInfoRAW = fs.readFileSync("private/projectInfo.json");
	var projectInfo = JSON.parse(projectInfoRAW)
	console.log(projectInfo)
	var localLND = require("./lnd.js")
	var lightning = localLND.init()
	var localDB = require("./db.js")
	this.watchGmail(gmail,projectInfo.topicName)
	localDB.initDB(db =>{
		startGmailD(db)
	})
	

	function startGmailD(db){
		status.status="running"
		gmail.users.getProfile({userId:"me"},(err,res) =>{
			if(err){
				console.log(err)
			} else {
				if(res.data.historyId){
					console.log(res.data.historyId)
					listLabels(gmail,db,res.data.historyId,optionD)
				}
			}
		})
	}
	/**
	 * Lists the labels in the user's account.
	 *
	 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
	 */
	function listLabels(gmail,db,latestHistory,optionD) {
		gmail.users.labels.list({
			userId: 'me',
			}, (err, res) => {
				if (err) return console.log('The API returned an error: ' + err);
				const labels = res.data.labels;
				if (labels.length) {
					console.log('Labels:');
					labels.forEach((label) => {
						console.log(`- ${label.name}`);
						console.log(`- ${label.id}`);
						if(label.name == "Unpaid"){
							optionD.unpaidID = label.id
						}
						if(label.name == "Paid"){
							optionD.paidID = label.id
						}
					});
				} else {
					console.log('No labels found.');
				}
				listen(gmail,db,latestHistory,optionD)
			});
			//watchGmail(gmail);
			
		}

	function listen(gmail,db,latestHistory,optionD){
		// Imports the Google Cloud client library
		const {PubSub} = require('@google-cloud/pubsub');

		// Creates a client
		const pubsub = new PubSub({
			projectId: projectInfo.projectId,
			keyFilename: 'private/credsPubSub.json'
		});

		/**
		 * TODO(developer): Uncomment the following lines to run the sample.
		 */
		const subscriptionName = projectInfo.pullSubName;
		const timeout = 60;

		// References an existing subscription
		const subscription = pubsub.subscription(subscriptionName);

		// Create an event handler to handle messages
		let messageCount = 0;
		var lastHystoryId = latestHistory;
		const messageHandler = message => {
				//console.log(message);
			console.log(`Received message ${message.id}:`);
			console.log(`\tData: ${message.data}`);
			console.log(`\tAttributes: ${message.attributes}`);
			var dataOBJ = JSON.parse(message.data)
			var localEmail = dataOBJ.emailAddress
			var historyId = dataOBJ.historyId
			console.log(`\hID: ${historyId}`);
			gmail.users.history.list({
				userId:"me",
				
					startHistoryId:lastHystoryId == 0 ? historyId : lastHystoryId,

				
			}).then(res =>{
				console.log(res.data)
				//TODO:ERROR res.data.historyId
				lastHystoryId = res.data.historyId;
				if(res.data.history){
					res.data.history.forEach(element => {
						console.log("entering ")
						if(element.messages){
							console.log("mexs: ")
							element.messages.forEach(el =>{
								//console.log(el)
								if(el.id){
									var messageId = el.id
									var threadId = el.threadId
									//if in the history list there is a message id, get the message
									//It is not needed to read the message, we just need the id to reply to it
									gmail.users.messages.get({
										userId:"me",
										id:el.id
									}).then(resMex => {
										//console.log(resMex.data)
										
										if(resMex.data.labelIds.includes(optionD.unpaidID)){
											console.log("Found Unpaid")
											if(resMex.data.payload){
												if(resMex.data.payload.headers){
													var from
													var to
													var subject
													resMex.data.payload.headers.forEach(head => {
														//console.log(head)
														if(head.name=="From"){
															console.log("From: "+head.value)
															from=head.value
														}
														if(head.name=="To"){
															console.log("To: "+head.value)
															to=head.value
														}
														if(head.name=="Subject"){
															console.log("Subject: "+head.value)
															subject=head.value
														}
													})
													console.log(localEmail)
													if(to.includes(localEmail)){
														localDB.addMail(gmail,lightning,db,to,from,subject,messageId,threadId,optionD)
													} else {
														console.log("invalid receiver")
													}
												}
												if(resMex.data.payload.parts){
													resMex.data.payload.parts.forEach(part=>{
														//console.log(part)
													})

												}
											}
										}
										
									})
								}
							})
						}
						if(element.messagesAdded){
							console.log("mexs added: ")
							element.messagesAdded.forEach(el =>{
								//console.log(el)
								
							})
						}
					});
				}
			})
			
			messageCount += 1;

			// "Ack" (acknowledge receipt of) the message
			message.ack();
		};

		// Listen for new messages until timeout is hit
		subscription.on(`message`, messageHandler);

		localLND.listenInvoice(gmail,lightning,db,optionD)
		localLND.listenTransaction(gmail,lightning,db,optionD)
		console.log("mhhh")

		/*setTimeout(() => {
		subscription.removeListener('message', messageHandler);
		console.log(`${messageCount} message(s) received.`);
		}, timeout * 3000);*/
	}

	
	
}
module.exports.watchGmail = function watchGmail(gmail,topicName){
	gmail.users.watch({
		userId: 'me',
		requestBody: {
		// Replace with `projects/${PROJECT_ID}/topics/${TOPIC_NAME}`
		topicName: topicName
		},
		labelIds: [
			"SENT"
		],
		labelFilterAction:"include"
	}).then(res=>{console.log(res.data);})
	
	
}

module.exports.stopGamil = function(gmail){
	gmail.users.stop({
		userId:'me'
	})
}