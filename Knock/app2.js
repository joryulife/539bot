const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const crypto = require("crypto");
const async = require('async');
const path = require("path");
const util = require('util');
const cron = require('node-cron');
const mysql = require("mysql");
const fs = require('fs');

const sendMessage = require('./lib/sendMessage');
const messageTemplate = require('./lib/MessageTemplate');
const gnavi = require('./lib/gnaviapi');

const lineinfo = require('./lib/lineinfo');
const line = require('@line/bot-sdk');

const app = express();

//SDKのオブジェクト
const client = new line.Client({
    channelAccessToken: lineinfo.config.channelAccessToken
});
//mysqlのオブジェクト
const connection = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "puroisenn96",
    database: "Knockdb"
})
//時刻取得
const now = new Date();
let hour = now.getHours();
let min = now.getMinutes();
let sec = now.getSeconds();
if(sec >= 54){
  sec = 5;
  min = min + 1
  if(min == 59){
    min = 0;
    hour++;
  }
}else{
  sec = sec+5;
}


app.set('port',3000);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//アクセスによるrooting
app.get('/*.(png|bmp|jpg|jpeg)',(req,res)=>{
  fs.readFile('./qsimage/A001.jpg',(err,data)=>{
    if(err) throw err;
    console.log("sendimage");
    res.type('jpg');
    res.send(data);
  })
});


//指定時刻実行
/*cron.schedule(sec+" "+min+" "+hour+" * * *",()=>{
  console.log("cron実行");
  connection.query('select * from qs_ob where qs_id=?',"A001", function (error, results, fields){
      if(error)throw error;
      console.log(results);
      push(results);
  });
});*/

app.post('/callback',knock);
const planemessage = "登録：問題登録\nランキング:ランキング確認\n確認：自他の状況確認\n解説：問題の解説\n作問：配信Questionの作成\n編集：既存のQuestionの編集";
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
            let index,flag="";
            checkid(profile,flag)
              .then(function(flag){//初めてのユーザーか確認、結果をflagにしrootMessageに渡す
                rootByMessage(profile,message_text,flag,message)
                  .then(function(message){
                    sendMessage.send(req, messageTemplate.textMessage(message));
                  })
                  .catch((err)=>{
                    console.log("in 121:");
                    console.log(err);
                  })
            });
        }
    );
}

function setTimer(){
  connection.query('select * from qs_gplist', function (error, results, fields){
    if(err) throw err;
    for(let i=0;i < results.length;i++){
      cron.schedule(results[i].timer,(results)=>{
        connection.query('select * from qs_list weher GP=? and status=?',[results[i].GP],false,function(err,results,fields){
          if(err) throw err;
          connection.query('select * from qs_ob weher qs_id=?',[results[0].qs_id],(err,results,fields)=>{
            if(err) throw err;
            let qs_ob = results;
            connection.query('select usr_id from rank_?',[results[0].qs_id],(err,results,fields)=>{
              if(err) throw err;
              console.log("in 135 :"+results);
              push(qs_ob,results);
            });
          });
        });
      });
    }
  });
}

//DBからのデータをもとにFlexメッセージ作成用の配列を作成
function createQsText(results){
    console.log("in createQstext");
    const title = results[0].title;
    let imageUrl = results[0].qs_url;
    imageUrl = imageUrl.trim();
    let choices = [ results[0].cs1,results[0].cs2];
    let answers = ["回答1", "回答2"];
    if(results[0].cs3 != null){
        choices.push(results[0].cs3);
        answers.push("回答3");
        if(results[0].cs4 != null){
            choices.push(results[0].cs4);
            answers.push("回答4");
        }
    }
    return {title,imageUrl,choices,answers};//resolveならこれを返す、rejectならerrを返す
}

//各要素を受け取りFlexメッセージのobを生成して返す。
async function createQsOb (title,imageUrl,choices,answers) {
  console.log("createQsOb in ");
  const ms = await messageTemplate.customQuestionMessage(title,imageUrl,choices,answers);
  return ms;
}

//DBからのqs_obを受け取り送信までを行う。
async function push (qs_ob,usr_id){
  console.log("in");
  try{
    const ob = await createQsText(qs_ob);
    console.log(ob);
    const ms = await createQsOb(ob.title,ob.imageUrl.trim(),ob.choices,ob.answers);
    for(let i=0;i<usr_id.length;i++){
      connection.query('update usrlist set flag=? where usr_id=?',[ob.title,usr_id[i]],(err,results,fields)=>{if(err) throw err;});
    }
    client.multicast(usr_id,[ms]);
  } catch(e){
    console.log(e);
  }
}

//usrlistに該当lineIdがあるか判定
function checkid(profile,flag){
    return new Promise(function (resolve){
        connection.query('select COUNT(*) AS count from usrlist WHERE usr_id=?',[profile.userId], function (error, results, fields) {
            if (error){
                throw error;
            }
            if(results[0].count == "0"){
                flag="new";
                console.log("flag at checkid "+flag);
                resolve(flag);
            }else{
                connection.query('select flag from usrlist where usr_id=?',[profile.userId],function (error, results, fields){
                    if (error){
                        throw error;
                    }
                    flag=results[0].flag;
                    resolve(flag);
                });
            }
        });
    });
}

//usrlistのflagの状態により処理を行う
function rootByMessage(profile,message_text,flag,message){
    return new Promise(function(resolve){
        switch(flag){
          case "new":
            connection.query('insert into usrlist values(?,"plane",?)',[profile.userId, profile.displayName], function (error, results, fields){
              if(error){
                throw error;
              }
            });
            message = "こんにちは" + profile.displayName + "さん\nあなたのuseridを登録しました。\nuseridは" + profile.userId + "です。";
            resolve(message);
            break;
          case "plane":
            if(message_text == "登録"){
              connection.query('update usrlist set flag="登録" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
              message = "登録する問題の番号を入力してください。GPには自動で登録されます。";
            }else if(message_text == "解除"){
              connection.query('update usrlist set flag="解除" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
              message = "解除するGP番号を入力してください";
            }else if(message_text == "登録状況"){
              message = profile.displayName+"さんの登録しているGPは";       
            }else if(message_text == "ランキング"){
              connection.query('update usrlist set flag="ランキング" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
              message = "ランキングを確認する問題番号を入力してください";
            }else if(message_text == "確認"){
              connection.query('update usrlist set flag="確認受付" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
              message = "あなたのユーザーネームは" + profile.userId + "です。\n";
              message+= "確認したい人のidとGP番号を以下書式で入力してください\n";
              message+= "ユーザーid:GP番号";
            }else if(message_text == "解説"){
              connection.query('update usrlist set flag="解説" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
              message = "問題番号を入力してください";
            }else if(message_text == "作問"){
              connection.query('update usrlist set flag="作問" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
              message = "作問";
            }else if(message_text == "編集"){
              connection.query('update usrlist set flag="編集" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
              message = "編集";
            }else{
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
              message = planemessage;
            }
            resolve(message);
            break;
          case "登録":
            connection.query('select count(*) as count from qs_list where qs_id =?',[message_text],function (error, results, fields){
              if(error)throw error;
              if(results[0].count != 0){
                connection.query('select count(*) as count from rank_? where usr_id = ?',[message_text,profile.userId],function (error, results, fields){
                  if(error)throw error;
                  if(results[0].count == 0){
                    let ranktable = 'rank_'+message_text;
                    connection.query('insert into ?? values(?,NULL)',[ranktable,profile.userId],function (error, results, fields){
                      if(error)throw error;
                      message = "問題 " + message_text + "を登録しました";
                      connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
                      resolve(message);
                    });
                  }else{
                    message = "問題 " + message_text + "は登録済みです。";
                    connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
                    resolve(message);
                  }
                });
              }else{
                message="存在しない問題番号です。";
                connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
                resolve(message);
              }
            });
            break;
          case "解除":
            connection.query('select count(*) as count from qs_list where qs_id = ?',[message_text],function (error, results, fields){
              if(error)throw error;
              if(results[0].count != 0){
                let ranktable = 'rank_'+message_text;
                connection.query('select count(*) as count from ?? where usr_id = ?',[ranktable,profile.userId],function (error, results, fields){
                  if(error)throw error;
                  if(results[0].count != 0){
                    connection.query('delete from ?? where usr_id=?',[ranktable,profile.userId],function (error, results, fields){
                      if(error)throw error;
                      message = "問題 " + message_text + "の登録を解除しました。";
                      connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
                      resolve(message);
                    });
                  }else{
                    message = "問題 " + message_text + "は登録されていません。";
                    connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
                    resolve(message);
                  }
                });
              }else{
                message="存在しない問題番号です。";
                connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
                resolve(message);
              }
            });
            break;
          case "ランキング":
              connection.query('select qs_id,lastday from qs_list where qs_id=?',[message_text],function (error, results, fields){
                if(results.length != 0){
                  console.log(results);
                  if(error)throw error;
                  message = message_text + "の最終実施日"+results[0].lastday+"のランキングは\n";
                  let ranktable = 'rank_'+message_text;
                  connection.query('select * from ?? where time is not null and time>=? order by time',[ranktable,results[0].lastday],function (error, results, fields){
                    if(error)throw error;
                    if(results.length!=0){
                      for(let i=0;i<results.length;i++){
                        message+=(i+1)+"位"+results[i].usr_id+"\n";
                      }
                    }else{
                      message = "まだランキングが存在しません。";
                    }
                    connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
                    resolve(message);
                  });
                }else{
                  message="存在しない問題番号です。";
                  connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
                  resolve(message);
                }
              });
            break;
          case "確認受付":
            if(message_text.match(/\w{33}:\w+/gu)){
              let targetUsrId = message_text.substr(0,33);
              console.log(targetUsrId);
              let targetGpId = message_text.substr(34);
              console.log(targetGpId);
              connection.query('select qs_id,lastday from qs_list where GP = ? order by lastday',targetGpId,(error,results,fields)=>{
                if(error)throw error;
                message="";
                let name;
                console.log(results);
                if(results.length!=0){
                  for(let i=0;i<results.length;i++){
                    let ranktable = 'rank_'+results[i].qs_id;
                    console.log(ranktable);
                    let lastday = results[i].lastday;
                    connection.query('select usr_name,time from ?? where usr_id=?',[ranktable,targetUsrId],(error,results,fields)=>{
                      if(error)throw error;
                      name = results[i].usr_name;
                      console.log(name);
                      if(results[0].time >= lastday){
                        message+=lastday+" ○\n";
                      }else{
                        message+=lastday+" X\n";
                      }
                      console.log(message);
                    });
                    connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){
                      if(error)throw error;
                      message = name+"さんの状況は\n"+message;
                      resolve(message);
                    });
                  }
                }else{
                  connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields)=>{
                    if(error) throw error;
                    message="存在しないGP番号です。"
                    resolve(message);
                  });
                }
              });
            }else{
              message="書式が正しくありません。ホームに戻ります。";
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],function (error, results, fields){if(error)throw error;});
              resolve(message);
            }
            break;
          case "解説":
            message = "解説";
            resolve(message);
            break;
          case "作問":
            message="作問";
            resolve(message);
            break;
          case "編集":
            message = "編集";
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
    //setTimer();
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