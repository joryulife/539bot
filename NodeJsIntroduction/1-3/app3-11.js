const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const url = require('url');
const qs = require('querystring');

const index_page = fs.readFileSync('./index3-10.ejs','utf8');
const other_page = fs.readFileSync('./other3-12.ejs','utf8');
const style_css = fs.readFileSync('./style2-11.css','utf8');

var data = {
    'Taro':'09-999-999',
    'Hanako':'080-888-888',
    'Sachiko':'070-777-777',
    'Ichiro':'060-666-666',
};
var data2 = {
    'Taro':['taro@yamada','09-999-999','Tokyo'],
    'Hanako':['hanako@flower','080-888-888','Yokohama'],
    'Sachiko':['sachi@happy','070-777-777','Nagoya'],
    'Ichiro':['ichi@baseball','060-666-666','USA']
}

var server = http.createServer(getFromClient);

server.listen(3000);
console.log('Server start!');

function getFromClient(request,response){
    var url_parts = url.parse(request.url,true);
    //console.log(url_parts);
    switch(url_parts.pathname){
        case '/':
            response_index(request,response);
            break;
        case '/other':
            console.log('case other page');
            response_other(request,response);
            break;
        case '/style.css':
            response.writeHead(200,{'Content-Type':'text/css'});
            response.write(style_css);
            response.end();
            break;
        default:
            response.writeHead(200,{'Content-Type':'text/plain'});
            response.end('no page');
            break;
    }
}

function response_index(request,response){
    var msg = "これはINdexページです。";
    var content = ejs.render(index_page,{
        title:"Index",
        content:msg,
        data:data,
        filename:'data_item3-9'
    });
    response.writeHead(200,{'Content-Type':'text/html'});
    response.write(content);
    response.end();
}

function response_other(request,response){
    var msg = 'これはOtherページです。';
    var content = ejs.render(other_page,{
        title:'Other',
        content:msg,
        data,data2,
        filename:'data_item3-9',
    });
    response.writeHead(200,{'Content-Type':'text/html'});
    response.write(content);
    response.end();
}