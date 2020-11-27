var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var request = require('request');
var crypto = require("crypto");
var async = require('async');
var path = require("path");
var util = require('util');

var sendMessage = require('./lib/sendMessage');
var messageTemplate = require('./lib/MessageTemplate');
var gnavi = require('./lib/gnaviapi');

const lineinfo = require('./lib/lineinfo');
const line = require('@line/bot-sdk');

const client = new line.Client({
  channelAccessToken: lineinfo.config.channelAccessToken
});

app.set('port',3000);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//ルーティング
/*app.get('/', function(req, res) {
  res.send('<h1>Sekibun!!</h1>');
});
app.get('/index', function(request, response) {
  response.sendFile(path.join(__dirname + '/views/index.html'));
});
app.get('/home', function(request, response) {
  response.sendFile(path.join(__dirname + '/views/home.html'));
});*/

app.post('/callback',knock);

function knock (req, res) {
  console.log("in");
  // リクエストがLINE Platformから送られてきたか確認する
  if (lineinfo.config.validate_signature(req.headers['x-line-signature'], req.body)) {
    console.log("if return1");
    return;
  }

  //waterfallの[]内の無名関数の結果がcallbackされて第２引数の関数の結果が変える。
  async.waterfall([
      function(callback) {
        let event_data = req.body.events[0];
        // テキストか画像が送られてきた場合のみ返事をする
        if ((event_data.type != 'message') || ((event_data.message.type != 'text') && (event_data.message.type != 'image'))) {
          console.log("if retun 2");
          return;
        }
        // ユーザIDを取得する
        var user_id = event_data.source.userId;
        var message_id = event_data.message.id;
        var message_type = event_data.message.type;
        var message_text = event_data.message.text;

        if (event_data.source.type != 'user') return;
        
        client.getProfile(user_id)
          .then((profile) => {
            console.log(profile.displayName);
            console.log(profile.userId);
            console.log(profile.pictureUrl);
            console.log(profile.statusMessage);
            callback(req,profile.displayName,message_id,message_type,message_text);
          })
          .catch((err) => {
            console.log(err);
          });
      },
    ],
    // 返事を生成する関数
    function(req, displayName, message_id, message_type, message_text) {
      var message = "";
      message = "hello, " + displayName + "さん";
      sendMessage.send(req, messageTemplate.textMessage(message));
      return;
    }
  );
}

// 引数に指定した値以下のランダムな数値を取得する
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

app.listen(app.get('port'), ()=> {
  console.log('Node app is running');
});