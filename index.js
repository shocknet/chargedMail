var localGmail = require("./gmail.js")
/*localGmail.initGmail((url,auth)=>{
    const gmail = google.gmail({version: 'v1', auth});
    
    //listen(gmail,db,latestHistory)
})*/

var http = require('http');
var fs = require('fs');
var path = require('path');
//var qs = require('querystring');
var indexFile
var otherFile
/*fs.readFile('./public/index.html', function (err, html) {
    if (err) {
        throw err; 
    }       
    http.createServer(function(request, response) {  
        response.writeHeader(200, {"Content-Type": "text/html"});  
        res.write(req.url);
        response.write(html);  
        response.end();  
    }).listen(8000);
});*/
http.createServer(function (request, response) {
    console.log('request starting...');

    var filePath = './public' + request.url;
    if (filePath == './public/')
        filePath = './public/index.html';

    var extname = path.extname(filePath);
    var isCommand = false
    var contentType = 'text/html';
    switch (extname) {
        case '.js':
            contentType = 'text/javascript';
            break;
        case '.css':
            contentType = 'text/css';
            break;
        case '.json':
            contentType = 'application/json';
            break;
        case '.png':
            contentType = 'image/png';
            break;      
        case '.jpg':
            contentType = 'image/jpg';
            break;
        case '.wav':
            contentType = 'audio/wav';
            break;
            case '':
                console.log("prolly a command")
                isCommand = true
                handleCommand(request,response)
    }
    if(!isCommand){
        console.log("reading: "+filePath)
        fs.readFile(filePath, function(error, content) {
            if (error) {
                console.log(error)
                if(error.code == 'ENOENT'){
                    fs.readFile('./public//404.html', function(error, content) {
                        response.writeHead(200, { 'Content-Type': contentType });
                        response.end(content, 'utf-8');
                    });
                }
                else {
                    response.writeHead(500);
                    response.end('Sorry, check with the site admin for error: '+error.code+' ..\n');
                    response.end(); 
                }
            }
            else {
                response.writeHead(200, { 'Content-Type': contentType });
                response.end(content, 'utf-8');
            }
        });
    }

}).listen(8254);
console.log('Server running at http://localhost:8254/');

function handleCommand(request,response){
    console.log(request.body)
    var result = {}

    switch(request.url){
        case '/init':
            var localGmail = require("./gmail.js")
            if (request.method == 'POST') {
                var body = '';
        
                request.on('data', function (data) {
                    body += data;
        
                    // Too much POST data, kill the connection!
                    // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                    if (body.length > 1e6)
                        request.connection.destroy();
                });
        
                request.on('end', function () {
                    // var post = qs.parse(body);
                    result.result = "success"
                    body = JSON.parse(body)
                    console.log(body)
                    if(body.code){
                        console.log("starting i guess")
                        localGmail.initGmail(body.code,(url,auth)=>{
                            if(auth){
                                result.result = "success"
                                response.writeHead(200, { 'Content-Type':'text/html' });
                                response.end(JSON.stringify(result), 'utf-8');
                            }
                        })
                    } else {
                        result.result = "error"
                        response.writeHead(200, { 'Content-Type':'text/html' });
                        response.end(JSON.stringify(result), 'utf-8');
                    }
                    // use post['blah'], etc.
                });
            } else{
                localGmail.initGmail("",(url,auth)=>{
                    if(url){
                        console.log("hehe")
                        result.response = "success"
                        result.url = url
                        response.writeHead(200, { 'Content-Type':'text/html' });
                        response.end(JSON.stringify(result), 'utf-8');
                    }
                })
            }
            
            
            break
        case '/check':
            var localGmail = require("./gmail.js")
            localGmail.checkToken(err=>{
                if(err){
                    result.result = "error"
                    response.writeHead(200, { 'Content-Type':'text/html' });
                    response.end(JSON.stringify(result), 'utf-8');
                } else {
                    result.result = "success"
                    response.writeHead(200, { 'Content-Type':'text/html' });
                    response.end(JSON.stringify(result), 'utf-8');
                }
            })
            break
        case '/status':
            var cMail = require("./cMail.js")
            result.status = cMail.getStatus()
            result.result = "success"
            response.writeHead(200, { 'Content-Type':'text/html' });
            response.end(JSON.stringify(result), 'utf-8');
            break
        case '/start':
                if (request.method == 'POST') {
                    var body = '';
            
                    request.on('data', function (data) {
                        body += data;
            
                        // Too much POST data, kill the connection!
                        // 1e6 === 1 * Math.pow(10, 6) === 1 * 1000000 ~~~ 1MB
                        if (body.length > 1e6)
                            request.connection.destroy();
                    });
            
                    request.on('end', function () {
                        // var post = qs.parse(body);
                        result.result = "success"
                        body = JSON.parse(body)
                        console.log(body)
                        var localGmail = require("./gmail.js")
                        localGmail.initGmail("",(url,auth)=>{
                            if(auth){
                                var cMail = require("./cMail.js")
                                const {google} = require('googleapis');
                                const gmail = google.gmail({version: 'v1', auth});
                                cMail.startD(gmail,{
                                    cost:body.cost,
                                    message:body.message
                                })
                                result.result = "success"
                                response.writeHead(200, { 'Content-Type':'text/html' });
                                response.end(JSON.stringify(result), 'utf-8');
                            }
                        })
                        
                        // use post['blah'], etc.
                    });
                }
            break
        case '/stop':
            result.result = "success"
            response.writeHead(200, { 'Content-Type':'text/html' });
            response.end(JSON.stringify(result), 'utf-8');
            process.kill(process.pid, 'SIGTERM')
            break
        default:
                response.writeHead(500);
                result.result = "error"
                result.error = "Sorry, thsi command is invalid"
                response.end(JSON.stringify(result));
                response.end();
    }
}