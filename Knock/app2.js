const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const crypto = require("crypto");
const async = require('async');
const path = require("path");
const util = require('util');
const cron = require('node-cron');
const mysql = require("mysql");

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

var connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "puroisenn96",
    database: "Knockdb"
})

app.set('port',3000);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


//指定時刻実行
/*cron.schedule(QS[testnum].timer,()=>{
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
});*/


app.post('/callback',knock);
const planemessage = "登録：問題登録\nランキング:ランキング確認\n確認：自他の状況確認\n解説：問題の解説\n作問：配信Questionの作成\n編集：既存のQuestionの作成";
function knock (req, res) {
    //console.log(req.headers);
    // リクエストがLINE Platformから送られてきたか確認する
    if (!lineinfo.config.validate_signature(req.headers['x-line-signature'], req.body)) {
        console.log('X-Line-Signature validation error');
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
            var message = "plane";
            let index,flag;
            checkid(profile,flag).then(function(flag){
                console.log("in 107"+flag);
                rootByMessage(profile,message_text,flag,message).then(function(message){
                    sendMessage.send(req, messageTemplate.textMessage(message));
                })
            });
        }
    );
}

function pushMessage(qs_id){
  return new Promise(function (resolve){
    connection.query('select * from qs_ob where qs_id="'+qs_id+'"', function (error, results, fields){
      if(error)throw error;
      var title = "問題"+qs_id;
      var imageUrl = '"'+results[0].qs_url+'"';
      var choices = [ '"'+results[0].cs1+'"',  '"'+results[0].cs2+'"', '"'+results[0].cs3+'"','"'+results[0].cs4+'"'];
      var answers = ["回答1", "回答2", "回答3", "回答4"];
      var ms = messageTemplate.customQuestionMessage(title,imageUrl,choices,answers);
      resolve(ms);
    });
  });
}

function checkid(profile,flag){
    return new Promise(function (resolve){
        connection.query('select COUNT(*) AS count from usrlist WHERE usr_id="'+profile.userId+'"', function (error, results, fields) {
            if (error){
                throw error;
            }
            if(results[0].count == "0"){
                console.log("if");
                flag="new";
                resolve(flag);
            }else{
                console.log("else");
                connection.query('select flag from usrlist where usr_id="'+profile.userId+'"',function (error, results, fields){
                    if (error){
                        throw error;
                    }
                    flag=results[0].flag;
                    console.log("in 133 "+results[0].flag);
                    resolve(flag);
                });
            }
        });
    });
}

function rootByMessage(profile,message_text,flag,message){
    return new Promise(function(resolve){
        switch(flag){
          case "new":
            connection.query('INSERT INTO usrlist VALUES("' + profile.userId + '","plane","' + profile.displayName + '")',function (error, results, fields){if(error)throw error;});
            message = "こんにちは" + profile.displayName + "さん\nあなたのuseridを登録しました。\nuseridは" + profile.userId + "です。";
            resolve(message);
            break;
          case "plane":
            if(message_text == "登録"){
              connection.query('update usrlist set flag="登録" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
              message = "登録する問題番号を入力してください";
            }else if(message_text == "解除"){
              connection.query('update usrlist set flag="解除" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
              message = "解除する問題番号を入力してください";
            }else if(message_text == "ランキング"){
              connection.query('update usrlist set flag="ランキング" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
              message = "ランキングを確認する問題番号を入力してください";
            }else if(message_text == "確認"){
              connection.query('update usrlist set flag="確認受付" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
              message = "あなたのユーザーネームは" + profile.userId + "です。\n";
              message+= "確認したい人のidを入力してください\n";
              message+= "ユーザーid:問題番号";
            }else if(message_text == "解説"){
              connection.query('update usrlist set flag="解説" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
              message = "問題番号を入力してください";
            }else if(message_text == "作問"){
              connection.query('update usrlist set flag="作問" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
              message = "作問";
            }else if(message_text == "編集"){
              connection.query('update usrlist set flag="編集" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
              message = "編集";
            }else{
              connection.query('update usrlist set flag="plane" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
              message = planemessage;
            }
            resolve(message);
            break;
          case "登録":
            connection.query('select count(*) as count from qslist where qs_id = "'+message_text+'"',function (error, results, fields){
              if(error)throw error;
              if(results[0].count != 0){
                connection.query('select count(*) as count from rank_'+message_text+' where usr_id = "'+profile.userId+'"',function (error, results, fields){
                  if(error)throw error;
                  if(results[0].count == 0){
                    connection.query('insert into rank_'+message_text+' values("'+profile.userId+'",NULL)',function (error, results, fields){
                      if(error)throw error;
                      message = "問題 " + message_text + "を登録しました";
                      connection.query('update usrlist set flag="plane" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
                      resolve(message);
                    });
                  }else{
                    message = "問題 " + message_text + "は登録済みです。";
                    connection.query('update usrlist set flag="plane" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
                    resolve(message);
                  }
                });
              }else{
                message="存在しない問題番号です。";
                connection.query('update usrlist set flag="plane" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
                resolve(message);
              }
            });
            break;
          case "解除":
            connection.query('select count(*) as count from qslist where qs_id = "'+message_text+'"',function (error, results, fields){
              if(error)throw error;
              if(results[0].count != 0){
                connection.query('select count(*) as count from rank_'+message_text+' where usr_id = "'+profile.userId+'"',function (error, results, fields){
                  if(error)throw error;
                  if(results[0].count != 0){
                    connection.query('delete from rank_'+message_text+' where usr_id="'+profile.userId+'"',function (error, results, fields){
                      if(error)throw error;
                      message = "問題 " + message_text + "の登録を解除しました。";
                      connection.query('update usrlist set flag="plane" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
                      resolve(message);
                    });
                  }else{
                    message = "問題 " + message_text + "は登録されていません。";
                    connection.query('update usrlist set flag="plane" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
                    resolve(message);
                  }
                });
              }else{
                message="存在しない問題番号です。";
                connection.query('update usrlist set flag="plane" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
                resolve(message);
              }
            });
            break;
          case "ランキング":
            connection.query('select count(*) as count from qslist where qs_id="'+message_text+'"',function (error, results, fields){
              if(error)throw error;
              if(results[0].count != 0){
                connection.query('select * from qslist where qs_id="'+message_text+'"',function (error, results, fields){
                  if(error)throw error;
                  message = message_text + "の最終実施日"+results[0].lastday+"のランキングは\n";
                  connection.query('select * from rank_'+message_text+' order by time',function (error, results, fields){
                    if(error)throw error;
                    for(let i=0;i<results.length;i++){
                      message+=i+"位"+results[i].usr_id+"\n";
                    }
                    connection.query('update usrlist set flag="plane" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
                    resolve(message);
                  });
                });
              }else{
                message="存在しない問題番号です。";
                connection.query('update usrlist set flag="plane" where usr_id="'+profile.userId+'"',function (error, results, fields){if(error)throw error;});
                resolve(message);
              }
            });
            break;
          case "確認受付":
            message = "確認受付";
            resolve(message);
            break;
          case "解説":
            message = "解説";
            resolve(message);
            break;
          default:
            message = planemessage;
            resolve(message);
            break;
        }
    });
}


// 引数に指定した値以下のランダムな数値を取得する
function getRandomInt(max) {
    return Math.floor(Math.random() * Math.floor(max));
}

app.listen(app.get('port'), ()=> {
    console.log('Node app is running');
});

/*
[ { id: '000', flag: 'plane', name: 'テストユーザー001' },
  { id: 'U3aa127f38f35ddee3962757fe0d50eba',
    flag: '001',
    name: '福應拓巳 🐗' },
  { id: 'Uffabcf2ec5a3d50360ae705f95a1d909',
    flag: 'plane',
    name: 'Hiroshi Fukuo' },
  { id: 'U2b948fca4c7ce8c760232c4d0218e713',
    flag: 'plane',
    name: '福應あゆみ' } ]
*/