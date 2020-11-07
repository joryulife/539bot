const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const url = require('url');

const index_page = fs.readFileSync('./index2-12.ejs','utf8');
const style_css = fs.readFileSync('./style2-11.css');

var server = http.createServer(getFromClient);

server.listen(3000);
console.log('Server start!');

function getFromClient(request,response){
    var url_parts = url.parse(request.url);
    switch (url_parts.pathname){
        case '/':
            var content = ejs.render(index_page,{
                title:"Index",
                content:"これはテンプレートを用いたサンプルページです。"
            });
            response.writeHead(200,{'content-Type':'text/html'});
            response.write(content);
            response.end();
            break;

        case '/style.css':
            response.writeHead(200,{'Content-Type':'text/css'});
            response.write(style_css);
            response.end();
            break;

        default:
            response.writeHead(200,{'Content-Type':'text/plain'});
            response.end('no page...');
            break;
    }
}