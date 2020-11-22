const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const url = require('url');
const qs = require('querystring');

const index_page = fs.readFileSync('./index3-15.ejs','utf8');
const other_page = fs.readFileSync('./other3-12.ejs','utf8');
const style_css = fs.readFileSync('./style2-11.css','utf8');

var data = {
    msg:'no message...'
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
    //POSTアクセス時
    if(request.method == 'POST'){
        console.log("response_index post in");
        var body = '';
        //データ受信イベント処理
        request.on('data',(data) => {
            body += data;
        });
        //データ受信終了時の処理
        request.on('end',() => {
            data = qs.parse(body);
            //クッキーの保存
            setCookie('msg',data.msg,response);
            write_index(request,response);
        });
    } else {
        console.log("response_index not post in");
        write_index(request,response);
    }
}

//indexのページ作成
function write_index(request,response){
    console.log("write_index in");
    var msg = "※伝言を表示します";
    var cookie_data = getCookie('msg',request);
    var content = ejs.render(index_page,{
        title:'Index',
        content:msg,
        data,data,
        cookie_data:cookie_data,
    });
    response.writeHead(200,{'Content-Type':'text/html'});
    response.write(content);
    response.end();
}

//クッキーの値を作成
function setCookie(key,value,response){
    console.log("setCookie in");
    var cookie = escape(value);
    console.log(cookie);
    response.setHeader('Set-Cookie',[key + '=' + cookie]);
    console.log("setHeader was over");
    
}

//クッキーの値を取得
function getCookie(key,request){
    console.log("getCookie in");
    var cookie_data = request.headers.cookie != undefined ? request.headers.cookie : '';
    var data = cookie_data.split(';');
    for(var i in data){
        if(data[i].trim().startsWith(key + '=')){
            var result = data[i].trim().substring(key.length + 1);
            return unescape(result);
        }
    }
    return '';
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