module.exports.initGmail = function(code,callbackInit){
    const fs = require('fs');
    
    const {google} = require('googleapis');
    

    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    const TOKEN_PATH = 'private/token.json';

    // Load client secrets from a local file.
    fs.readFile('private/creds.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), (url,auth)=>{
            if(callbackInit){
                callbackInit(url,auth)
            }
        });
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
		const {client_secret, client_id, redirect_uris} = credentials.installed;
		const oAuth2Client = new google.auth.OAuth2(
			client_id, client_secret, redirect_uris[0]);

		// Check if we have previously stored a token.
		fs.readFile(TOKEN_PATH, (err, token) => {
			if (err) return getNewToken(oAuth2Client,code, callback);
			oAuth2Client.setCredentials(JSON.parse(token));
			callback("",oAuth2Client);
		});
    }
    
}
module.exports.checkToken= function(callbackCheck){
	const fs = require('fs');
    const {google} = require('googleapis');
    // The file token.json stores the user's access and refresh tokens, and is
    // created automatically when the authorization flow completes for the first
    // time.
    const TOKEN_PATH = 'private/token.json';

    // Load client secrets from a local file.
    fs.readFile('private/creds.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Gmail API.
    authorize(JSON.parse(content), err=>{
            callbackCheck(err)
        });
    });

    /**
     * Create an OAuth2 client with the given credentials, and then execute the
     * given callback function.
     * @param {Object} credentials The authorization client credentials.
     * @param {function} callback The callback to call with the authorized client.
     */
    function authorize(credentials, callback) {
		const {client_secret, client_id, redirect_uris} = credentials.installed;
		const oAuth2Client = new google.auth.OAuth2(
			client_id, client_secret, redirect_uris[0]);

		// Check if we have previously stored a token.
		fs.readFile(TOKEN_PATH, (err, token) => {
			callback(err)
			return
		});
    }
}
/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client,code, callback) {
	    // If modifying these scopes, delete token.json.
	const SCOPES = ['https://mail.google.com/',
		'https://www.googleapis.com/auth/gmail.modify',
		'https://www.googleapis.com/auth/gmail.modify',
		'https://www.googleapis.com/auth/gmail.send'];
    const authUrl = oAuth2Client.generateAuthUrl({
		access_type: 'offline',
		scope: SCOPES,
    });
	if(code == ""){
		console.log('Authorize this app by visiting this url:', authUrl);
		callback(authUrl,null);
		/*const readline = require('readline');
		const rl = readline.createInterface({
			input: process.stdin,
			output: process.stdout,
		});
		rl.question('Enter the code from that page here: ', (code) => {
			rl.close();
			oAuth2Client.getToken(code, (err, token) => {
				if (err) return console.error('Error retrieving access token', err);
				oAuth2Client.setCredentials(token);
				const fs = require('fs');
				const TOKEN_PATH = 'private/token.json';
				// Store the token to disk for later program executions
				fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
					if (err) return console.error(err);
					console.log('Token stored to', TOKEN_PATH);
				});
				callback(url,null);
			});
		});*/
	} else {
		oAuth2Client.getToken(code, (err, token) => {
			if (err) return console.error('Error retrieving access token', err);
			oAuth2Client.setCredentials(token);
			const fs = require('fs');
			const TOKEN_PATH = 'private/token.json';
			// Store the token to disk for later program executions
			fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
				if (err) return console.error(err);
				console.log('Token stored to', TOKEN_PATH);
			});
			callback("",oAuth2Client);
		});
	}
}

module.exports.sendEmail = function(gmail,from,to,messageId,threadId,subject,data){
	//console.log(to)
	//console.log(gmail)
	/*var email = {
		mimeType: 'text/plain',
		filename: '',
		headers:[
			{ name: 'MIME-Version', value: '1.0' },
			{ name: 'Subject', value: subject },
			{ name: 'To', value: to },
			{ name: 'From', value:from },
			{ name: 'Content-Type', value: 'text/plain; charset="UTF-8"' },
			{ name: 'In-Reply-To', value: messageId },
		],
		body:{size:data.length,data:data}
	}*/
	var email = "Content-Type: text/plain; charset=\"UTF-8\"\n" +
	"MIME-Version: 1.0\n" +
	"Content-Transfer-Encoding: 7bit\n" +
	//"References: <CADsZLRxZDUGn4Frx80qe2_bE5H5bQhgcqGk=GwFN9gs7Z_8oZw@mail.gmail.com> <CADsZLRyzVPLRQuTthGSHKMCXL7Ora1jNW7h0jvoNgR+hU59BYg@mail.gmail.com> <CADsZLRwQWzLB-uq4_4G2E64NX9G6grn0cEeO0L=avY7ajzuAFg@mail.gmail.com>\n" +
	"In-Reply-To: "+messageId+"\n" +
	"Subject: "+subject+"\n" +
	"From: "+from+"\n" +
	"To: "+to+"\n\n" +
	data
	var Base64 = require('js-base64').Base64
	var base64EncodedEmail = Base64.encodeURI(email);
	gmail.users.messages.send({
		userId:"me",
		uploadType:"multipart",
		requestBody:{
			threadId:threadId,
			raw:base64EncodedEmail
		}
	}).then(res=>{
		//handle res?
	})
}
module.exports.SetAsPaid = function (gmail,messageId,optionD, callback) {
	gmail.users.messages.modify({
		'userId': "me",
		'id': messageId,
		requestBody:{
			'addLabelIds': [optionD.paidID],
			'removeLabelIds': [optionD.unpaidID]
	  }
	}).then(res=>{callback(res)});
  }