const http = require('http');//httpというモジュールをロード　httpという変数にオブジェクトとして設定

var server = http.createServer(     //サーバーオブジェクトの作成
    //requestにはhttp.ClientRequestというオブジェクトが入っている。クライアントからの情報を管理する。
    //responceにはhttp.ServerResponseというオブジェクトが入っている。サーバーからの情報を管理する。
    (request,response)=>{           //関数(request,response)=>{}を引数に入れている。    == function(request,response){}
        response.end('Hello Node.js!'); //関数内処理 .endでクライアントへのレスポンスはこれで終了ということを示す
    }
);
server.listen(3000);