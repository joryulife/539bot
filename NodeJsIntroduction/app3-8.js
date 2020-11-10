const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const url = require('url');
const qs = require('querystring');

const index_page = fs.readFileSync('./index3-10.ejs','utf8');
const other_page = fs.readFileSync('./other.ejs','utf8');
const style_css = fs.readFileSync('./style2-11.css','utf8');

var data = {
    'Taro':'09-999-999',
    'Hanako':'080-888-888',
    'Sachiko':'070-777-777',
    'Ichiro':'060-666-666',
};

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

    //POSTアクセス時の処理
    //console.log(request);
    console.log(request.method);
    if(request.method == 'POST'){
        var body = '';
        //データ受信の処理
        request.on('data',(data)=>{ //データが大きい場合、分割して送られてくるので受け取った順に結合していく
            body += data;
        });
        //データ受信終了の処理
        request.on('end',()=>{
            var post_data = qs.parse(body); //body に入っているデータはクエリーテキスト形式なのでparseでエンコードする。
            console.log(post_data);
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