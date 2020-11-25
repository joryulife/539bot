const http = require('http');
const fs = require('fs');

var server = http.createServer(
    function(request,response){
        fs.readFile('./index2-4.html','UTF-8',
        (error,data) => {
            response.writeHead(200,{'Content-type': 'text/html'});
            response.write(data);
            response.end();
        });
    }
);

server.listen(3000);
console.log('Server start!');