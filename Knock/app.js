const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const crypto = require("crypto");
const async = require('async');
const path = require("path");
const util = require('util');
const cron = require('node-cron');

var sendMessage = require('./lib/sendMessage');
var messageTemplate = require('./lib/MessageTemplate');
var gnavi = require('./lib/gnaviapi');

const lineinfo = require('./lib/lineinfo');
const line = require('@line/bot-sdk');

const app = express();
//SDKのオブジェクト
const client = new line.Client({
  channelAccessToken: lineinfo.config.channelAccessToken
});
//時刻取得
const now = new Date();
let hour = now.getHours();
let min = now.getMinutes() + 1;
if(min == 59){
  min = 0;
  hour++;
}
//DB代わりの連想配列その他
const testnum = 2;
var usrlist = [{id:"000",flag:"plane",name:"テストユーザー001"}];
var title = "問題001";
var imageUrl = "https://noschool.asia/wp-content/uploads/2017/12/IMG_20171222_220633.jpg";
var choices = ["選択肢1", "選択肢2", "選択肢3", "選択肢4"];
var answers = ["回答1", "回答2", "回答3", "回答4"];
var ms = messageTemplate.customQuestionMessage(title,imageUrl,choices,answers);
var QS =[{id:"000",rank:["テストユーザー334","テストユーザー539","テストユーザー666"],
          usrid:["000","001"],timer:"00"+min+" "+hour+" * * *",qs:ms,ans:"回答1"},
         {id:"001",rank:["テストユーザー334","テストユーザー539","テストユーザー666"],
          usrid:["U3aa127f38f35ddee3962757fe0d50eba"],timer:"00"+min+" "+hour+" * * *",qs:ms,ans:"回答1"},
         {id:"002",rank:["テストユーザー334","テストユーザー539","テストユーザー666"],
          usrid:[],timer:"00"+min+" "+hour+" * * *",qs:ms,ans:"回答1"}
        ];

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

//指定時刻実行
cron.schedule(QS[testnum].timer,()=>{
  async.waterfall([
    function(callback){
      let mes = QS[testnum].qs;
      for(let i = 0;i < QS[testnum].usrid.length;i++){
        for(let j = 0;j < usrlist.length;j++){
          if(usrlist[j].id == QS[testnum].usrid[i]){
            usrlist[j].flag = QS[testnum].id;
            break;
          }
        }
      }
      callback(mes);
    }
  ],function(mes){
    client.multicast(QS[testnum].usrid,[mes]);
  })
  console.log("cron実行");
});


app.post('/callback',knock);

function knock (req, res) {
  console.log(req.headers);
  // リクエストがLINE Platformから送られてきたか確認する
  if (!lineinfo.config.validate_signature(req.headers['x-line-signature'], req.body)) {
    //console.log('X-Line-Signature validation error');
    return;
  }
  

  //waterfallの[]内の無名関数の結果がcallbackされて第２引数の関数の結果が変える。
  async.waterfall([
      function(callback) {
        let event_data = req.body.events[0];
        // テキストか画像が送られてきた場合のみ返事をする
        if ((event_data.type != 'message') || ((event_data.message.type != 'text') && (event_data.message.type != 'image'))) {
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
            callback(req,profile,message_id,message_type,message_text);
          })
          .catch((err) => {
            console.log(err);
          });
      },
    ],
    // 返事を生成する関数
    function(req, profile, message_id, message_type, message_text) {
      var message = "";
      let index,flag = 1;
      for(let i = 0;i < usrlist.length;i++){
        if(usrlist[i].id == profile.userId){
          index = i;
          flag = 0;
        }
      }
    console.log(flag);
      if(flag){
        usrlist.push({id:profile.userId,flag:"plane",name:profile.displayName});
        console.log(usrlist);
        message = "useridを登録しました";
      }else if(message_text == "登録"){
        usrlist[index].flag = "登録";
        message = "問題番号を入力してくだい";
      }else if(message_text == "ランキング"){
        usrlist[index].flag = "ランキング";
        message = "問題番号を入力してくだい";
      }else if(message_text == "確認"){
        usrlist[index].flag = "確認";
        message = "useridを入力してください";
      }else if(message_text == "解説"){
        usrlist[index].flag == "解説";
        message = "問題番号を入力してくだい"
      }else if(usrlist[index].flag == "登録"){
        for(let i = 0;i < QS.length;i++){
          if(QS[i].id == message_text){
            if(QS[i].usrid.length >= 1){
              for(let j = 0;j < QS[i].usrid.length;j++){
                if(QS[i].usrid[j] == usrlist[index].id){
                  message = "既に登録済みです。"
                  usrlist[index].flag = "plane";
                  break;
                }else{
                  message = "問題 " + message_text + "を登録しました";
                  QS[i].usrid.push(profile.userId);
                  usrlist[index].flag = "plane";
                }
              }
            }else{
              message = "問題 " + message_text + "を登録しました";
              QS[i].usrid.push(profile.userId);
              usrlist[index].flag = "plane";
            }
            break;
          }else{
              message = "存在しない問題番号です。";
              usrlist[index].flag = "plane";
          }
        }
      }else if(usrlist[index].flag == "ランキング"){
        for(let i = 0;i < QS.length;i++){
          if(QS[i].id == message_text){
            message = "問題 " + message_text + "のランキングは\n";
            for(let j = 0;j < QS[i].rank.length;j++){
              message += QS[i].rank[j] + "\n";
            }
            usrlist[index].flag = "plane";
            break;
          }else{
            usrlist[index].flag = "plane";
            message = "存在しない問題番号です。" + usrlist[index].flag;
          }
        }
      }else if(usrlist[index].flag.match(/[0-9]+/)){
        for(let i = 0;i < QS.length;i++){
          if(QS[i].id == usrlist[index].flag){
            if(message_text == QS[i].ans){
              message = "正解です\nあなたのランキングは\n";
              usrlist[index].flag = "plane";
              QS[i].rank.push(profile.displayName);
              for(let j = 0;j < QS[i].rank.length;j++){
                message += QS[i].rank[j] + "\n";
              }
            }else{
              message = "不正解です。もう一度";
            }
          }
        }
      }else if(usrlist[index].flag == "確認"){
        message = "あなたのユーザーネームは" + profile.userId + "です。\n";
        message+= "確認したい人のidを入力してください\n";
        message+= "ユーザーid:問題番号";
      }else{
        usrlist[index].flag = "plane";
        message = "登録：問題登録\nランキング:ランキング確認\n確認：自他の状況確認\n解説：問題の解説";
      }
      console.log(usrlist);
      console.log(QS);
      sendMessage.send(req, messageTemplate.textMessage(message));
      return;
    }
  );
}

function question(){}
// 引数に指定した値以下のランダムな数値を取得する
function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

app.listen(app.get('port'), ()=> {
  console.log('Node app is running');
});