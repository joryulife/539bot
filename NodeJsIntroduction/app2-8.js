const http = require('http');
const fs = require('fs');
const ejs = require('ejs');

const index_page = fs.readFileSync('./index2-7.ejs','utf8');

var server = http.createServer(getFromClient);

server.lsiten(3000);
console.log('Server start!');

//createserverの処理
function getFromClient(request,response) {
    var content = ejs.render(index_page);
    response.writeHead(200,{'Content-Type':'text/html'});
    response.write(content);
    response.end();
}