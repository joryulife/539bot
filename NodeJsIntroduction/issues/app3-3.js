const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const url = require('url');
const qs = require('querystring');

const index_page = fs.readFileSync('./index3-2.ejs','utf8');
const other_page = fs.readFileSync('./other.ejs','utf8');
const style_css = fs.readFileSync('./style2-11.css','utf8');

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
            console.log(request);
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
    console.log('index function in');
    var msg = "これはIndexページです";
    var content = ejs.render(index_page,{
        title:'Index',
        content:msg,
    });
    response.writeHead(200,{'Content-Type':'text/html'});
    response.write(content);
    response.end();
}

function response_other(request,response){
    var msg = 'これはOtherページです。';

    //POSTアクセス時の処理
    //console.log(request);
    console.log(request.methot);
    if(request.methot == 'POST'){
        var body = '';
        //データ受信の処理
        request.on('data',(data)=>{
            body += 'data';
        });
        //データ受信終了の処理
        request.on('end',()=>{
            var post_data = qs.parse(body);
            msg += 'あなたは、「' + post_data.msg + '」と書きました';
            var content = ejs.render(other_page,{
                title:'Other',
                content:msg,
            });
            response.writeHead(200,{'Content-Type':'text/html'});
            response.write(content);
            response.end();
        });
    }
    //GETアクセス時の処理
    else {
        var msg = "ページがありません。";
        var content = ejs.render(other_page,{
            title:'other',
            content:msg,
        });
        response.writeHead(200,{'Content-Type':'text/html'});
        response.write(content);
        response.end();
    }
}