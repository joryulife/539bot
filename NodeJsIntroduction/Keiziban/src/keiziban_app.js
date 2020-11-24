const http = require('http');
const fs = require('fs');
const ejs = require('ejs');
const url = require('url');
const qs = require('querystring');

const index_page = fs.readFileSync('./index.ejs','utf-8');
const login_page = fs.readFileSync('./login.ejs','utf-8');

const max_num = 10; //最大保管数
const filename = '../docs/mydata.txt'; //データファイル名
var message_data;
readFromFile(filename);

var server = http.createServer(getFromClient);

server.listen(3000);
console.log("Server start");

function getFromClient(request,response){
    console.log('getFromClient in');
    var url_parts = url.parse(request.url,true);
    switch(url_parts.pathname){
        case '/'://トップページのメッセージボード
            console.log(" case / in ");
            response_index(request,response);
            break;

        case '/login'://ログインページ
            console.log(" case ./login in");
            response_login(request,response);
            break;

        default:
            console.log("default in");
            response.writeHead(200,{'Content-Type':'text/plain'});
            response.write('no page...');
            break;
    }
}

function response_login(request,response){
    console.log("response_login in");
    var content = ejs.render(login_page,{});
    response.writeHead(200,{'Content-Type':'text/html'});
    response.write(content);
    response.end();
}

function response_index(request,response){
    console.log("respomse_index in");
    //POST
    if(request.method == 'POST'){
        console.log("POST in");
        var body = "";
        request.on('data',function(data){
            body += data;
        });
        request.on('end',function(){
            data = qs.parse(body);
            console.log("dataの中身");
            console.log(body);
            console.log(data.id);
            console.log(data.msg);
            console.log("dataの中身終了");
            addToData(data.id,data.msg,filename,request);
            write_index(request,response);
        });
    } else {
        write_index(request,response);
    }
}

function write_index(request,response){
    console.log("write/index in");
    var msg = "※何か書いてください。";
    var content = ejs.render(index_page,{
        title:'Index',
        content:'msg',
        data:message_data,
        filename:'data_item',
    });
    response.writeHead(200,{'Content-Type':'text/html'});
    response.write(content);
    response.end();
}

//テキストファイルをロード
function readFromFile(fname){
    console.log("readFromFile in");
    fs.readFile(fname,'utf8',(err,data) => {
        message_data = data.split('\n');
    })
}

//データを更新
function addToData(id,msg,fname,request){
    console.log("addToData in");
    var obj = {'id':id,'msg':msg};
    var obj_str = JSON.stringify(obj);
    console.log('add data: ' + obj_str);
    message_data.unshift(obj_str);
    if(message_data.length > max_num){
        message_data.pop();
    }
    saveTofile(fname);
}

//データを保存
function saveTofile(fname){
    console.log("saveTofile in");
    var data_str = message_data.join('\n');
    fs.writeFile(fname,data_str,(err)=>{
        if(err) {throw err;}
    });
}
