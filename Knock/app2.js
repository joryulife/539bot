const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const crypto = require("crypto");
const async = require('async');
const path = require("path");
const util = require('util');
const cron = require('node-cron');
const cronJob = require('cron').CronJob
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

app.set('port',3000);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

//アクセスによるrooting
app.get('/*.(png|bmp|jpg|jpeg)',(req,res)=>{
  console.log("AAAAAAAAAAAAAAAAAAAAAAAA");
  fs.readFile('./qsimage/000.jpg',(err,data)=>{
    if(err) throw err;
    console.log("sendimage");
    res.type('jpg');
    res.send(data);
  })
});


app.post('/callback',knock);
const planemessage = "登録：問グループへ登録\n解除：問グループから登録解除\nランキング:ランキング確認\n確認：自他の状況確認\n解説：問題の解説\n作問：配信Questionの作成\n編集：既存のQuestionの編集";
function knock (req, res) {
    // リクエストがLINE Platformから送られてきたか確認する
    if (!lineinfo.config.validate_signature(req.headers['x-line-signature'], req.body)) {
        console.log('70 X-Line-Signature validation error');
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
        (req, profile, message_id, message_type, message_text)=>{
            var message = "";
            let index,flag="";
            checkid(profile,flag)
              .then((flag)=>{//初めてのユーザーか確認、結果をflagにしrootMessageに渡す
                if(flag=="new"){
                  var temp = "";
                  var tempqs = "";
                  rootByMessage(req,profile,message_text,flag,temp,tempqs,message)
                  .then((message)=>{
                    if(message!="end"){
                      sendMessage.send(req, messageTemplate.textMessage(message));
                    }
                  })
                  .catch((err)=>{console.log(err);})
                }else{
                  connection.query('select * from usrlist where usr_id=?',[profile.userId],(error,results,fields)=>{
                    rootByMessage(req,profile,message_text,flag,results[0].temp,results[0].tempqs,results[0].target,message)
                    .then((message)=>{
                      if(message!="end"){
                        sendMessage.send(req, messageTemplate.textMessage(message));
                      }
                    })
                    .catch((err)=>{console.log(err);})
                  });
                }
            });
        }
    );
}

function setTimer(){
  console.log("set timer");
  connection.query('select * from qs_gplist',(error, results, fields)=>{
    if(error) throw error;
    for(let i=0;i < results.length;i++){
      cronjob = new cronJob({
        cronTime:results[i].timer,
        start:true,
        context:{result:results[i]},
        onTick:function(){
          pushQs(this.result.GP);
        }
      })
    } 
  });
}

function pushQs(result){
  connection.query('select * from qs_list where GP=? and status=?',[result,false],(error, results, fields)=>{
    if(error)throw error;
      if(results.length!=0){
      var index = Math.floor( Math.random() * results.length )
      const qs_id = results[index].qs_id;
      connection.query('select * from qs_ob where qs_id=?',[qs_id],(error, results, fields)=>{
        if(error) throw error;
        const qs_ob = results;
        const rank = "rank_"+qs_id;
        connection.query('select usr_id from ??',[rank],(err,results,fields)=>{
          if(err) throw err;
          var usr_id = [];
          for(let i = 0;i<results.length;i++){
            let usrid = results[i].usr_id;
            connection.query('select * from usrlist where usr_id=?',[usrid],(error,results,fields)=>{
              if(error) throw error;
              usrlistTargetUpdate(results[0].target,qs_id,usrid);
            });
            usr_id.push(results[i].usr_id);
            if(i==results.length-1){
              console.log("=========To push =========");
              push(qs_ob,usr_id);
            }
          }
        });
        connection.query('update qs_list set lastday=now(),status=? where qs_id=?',[true,qs_id],(error,results,fields)=>{if(error) throw error;});
      });
      connection.query('update qs_gplist set lastday=now() where GP=?',[result],(error,results,fields)=>{if(error) throw error;});
    }else{
      console.log("all true");
      connection.query('update qs_list set status=false where GP=?',[result],(error, results, fields)=>{
        if(error) throw error;
        pushQs(result);
      });
    }
  });
}


//DBからのデータをもとにFlexメッセージ作成用の配列を作成
async function createQsText(results){
    console.log("In createQstext");
    const title = results[0].qs_id;
    let imageUrl = results[0].qs_url;
    imageUrl = imageUrl.trim();
    let choices = [ results[0].cs1,results[0].cs2];
    let answers = ["問:"+title+"\n回答:1", "問:"+title+"\n回答:2"];
    if(results[0].cs3 != null){
        choices.push(results[0].cs3);
        answers.push("問:"+title+"\n回答:3");
        if(results[0].cs4 != null){
            choices.push(results[0].cs4);
            answers.push("問:"+title+"\n回答:4");
        }
    }
    return {title,imageUrl,choices,answers};//resolveならこれを返す、rejectならerrを返す
}

//各要素を受け取りFlexメッセージのobを生成して返す。
async function createQsOb (title,imageUrl,choices,answers) {
  console.log("createQsOb in ");
  console.log(title,imageUrl,choices,answers);
  const ms = await messageTemplate.customQuestionMessage(title,imageUrl,choices,answers);
  return ms;
}

//DBからのqs_obを受け取り送信までを行う。
async function push (qs_ob,usr_id){
  console.log("push in");
  try{
    const ob = await createQsText(qs_ob);
    const ms = await createQsOb(ob.title,ob.imageUrl.trim(),ob.choices,ob.answers);
    console.log("==========MS========");
    console.log(ms);
    client.multicast(usr_id,[ms]);
  }catch(e){
    console.log(e);
  }
}

//usrlistに該当lineIdがあるか判定
function checkid(profile,flag){
    return new Promise(function (resolve){
        connection.query('select * from usrlist WHERE usr_id=?',[profile.userId],(error, results, fields)=>{
            if (error){
                throw error;
            }
            if(results.length == 0){
                flag="new";
                console.log("289 flag at checkid "+flag);
                resolve(flag);
            }else{
                connection.query('select flag from usrlist where usr_id=?',[profile.userId],(error, results, fields)=>{
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

function rootPlane(req,profile,message_text,flag,temp,tempqs,target,message){
  return new Promise((resolve)=>{
    if(message_text == "登録"){
      connection.query('update usrlist set flag="登録" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      message = "登録する問題の番号を入力してください。GPには自動で登録されます。";
      resolve(message);
    }else if(message_text == "解除"){
      connection.query('update usrlist set flag="解除" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      message = "解除するGP番号または問題番号を入力してください\nグループ番号で解除の場合\nGP:グループ番号\n問題番号で解除の場合\nQS:問題番号";
      resolve(message);
    }else if(message_text == "登録状況"){
      message = profile.displayName+"さんの登録しているGPは";   
      resolve(message);
    }else if(message_text == "ランキング"){
      connection.query('update usrlist set flag="ランキング" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      message = "ランキングを確認する問題番号を入力してください";
      resolve(message);
    }else if(message_text == "確認"){
      connection.query('update usrlist set flag="確認受付" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      message = "あなたのidは" + profile.userId + "です。\n";
      message+= "確認したい人のidとGP番号を以下書式で入力してください\n";
      message+= "ユーザーid:GP番号";
      resolve(message);
    }else if(message_text == "解説"){
      connection.query('update usrlist set flag="解説" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      message = "問題番号を入力してください";
      resolve(message);
    }else if(message_text == "作問"){
      connection.query('update usrlist set flag="askAboutGP" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      message = "end";
      sendMessage.send(req,messageTemplate.quickMessage("作成する問のGPについて",["既存のGPに追加","新規GPから作成"]));
      resolve(message);
    }else if(message_text == "編集"){
      connection.query('update usrlist set flag="編集" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      message = "編集";
      resolve(message);
    }else if(message_text.match(/^問:/)){
      connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      judgeAns(profile,message_text,target).then((message)=>{
        resolve(message);
      }).catch((e)=>{throw e;});  
    }else{
      connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      message = planemessage;
      resolve(message);
    }
  });
}

function judge1(qs_id){
  return new Promise((resolve)=>{
    const message="現在あなたは"+qs_id+"の回答権を持っていません。";
    resolve(message);
  });
}

function judge1(profile,message_text,notjsonTarget,qs_id,qsIndex,rank){
  return new Promise((resolve)=>{
    connection.query('select * from qs_ob where qs_id=?',[qs_id],(error, results, fields)=>{
      console.log(message_text.split(/[:\n]+/)[3]);
      if(message_text.split(/[:\n]+/)[3]==results[0].CorrectAns){
        var message="正解です。"
        var dt = new Date();
        dt.setHours(dt.getHours()+14);
        var year = dt.getFullYear();
        var month = dt.getMonth()+1;
        var date = dt.getDate();
        const dateT = ["日","月","火","水","木","金","土"];
        var day = dateT[dt.getDay()];
        var hour = dt.getHours();
        var min = dt.getMinutes();
        var sec = dt.getSeconds();
        connection.query('select * from ?? where usr_id=?',[rank,profile.userId],(error, results, fields)=>{
          console.log(results[0]);
          console.log("now",dt);
          console.log("ペナルティ",results[0].penalty);
          console.log("penaltytime",results[0].penalty*5);
          if(min+results[0].penalty*5 >=60){
            hour=hour+1;
            min = results[0].penalty*5-(60-min);
          }else{
            min = min+results[0].penalty*5
          }
          const now = year+"-"+month+"-"+date+" "+hour+":"+min+":"+sec;
          console.log("new now",now);
          connection.query('update ?? set time=cast(? as datetime),penalty=0 where usr_id=?',[rank,now,profile.userId],(error, results, fields)=>{if(error) throw error;});
          const newTarget = JSON.stringify(notjsonTarget.splice(qsIndex,1));
          connection.query('update usrlist set target=? where usr_id=?',[newTarget,profile.userId],(error,results,fields)=>{if(error) throw error;});
          message+= now+"\nで記録しました。";
          resolve(message);
        });
      }else if(results[0].must==true){
        const message="不正解です。timeに5分のペナルティが付きました。もう一度回答してください。";
        connection.query('update ?? set penalty=penalty+1 where usr_id=?',[rank,profile.userId],(error,results,fields)=>{if(error) throw error;});
        resolve(message);
      }else{
        const message="不正解です。記録を残しました。" ;
        const now = new Date();
        now.setMinutes(now.getMinutes+results[0].penalty*5);
        connection.query('update ?? set time=?,penalty=0 where usr_id=?',[rank,now,profile.userId],(error, results, fields)=>{if(error) throw error;});
        const newTarget = JSON.stringify(notjsonTarget.splice(qsIndex,1));
        connection.query('update usrlist set target=? where usr_id=?',[newTarget,profile.userId],(error,results,fields)=>{if(error) throw error;});
        resolve(message);
      }
    });
  });
}

//正誤判定、成績記録
function judgeAns(profile,message_text,target){
  return new Promise((resolve)=>{
    const qs_id = message_text.split(/[:\n]+/)[1];
    console.log("target",target);
    const notjsonTarget = JSON.parse(target);
    console.log("notjsonTarget",notjsonTarget);
    const qsIndex = notjsonTarget.indexOf(qs_id);
    const rank = "rank_"+qs_id;
    if(qsIndex<0){
      judge1(qs_id).then((m)=>{
        console.log(m);
        resolve(m);
      }).catch((e)=>{
        console.log(e);
      });
    }else{
      judge1(profile,message_text,notjsonTarget,qs_id,qsIndex,rank).then((m)=>{
        console.log(m);
        resolve(m);
      }).catch((e)=>{
        console.log(e);
      });
    }
  });
}

//usrlistのflagの状態により処理を行う
function rootByMessage(req,profile,message_text,flag,temp,tempqs,target,message){
    return new Promise(function(resolve){
        console.log(flag);
        switch(flag){
          case "new":
            var wait = [];
            var wait_json = JSON.stringify(wait);
            connection.query('insert into usrlist values(?,"plane",null,null,?,?)',[profile.userId, profile.displayName,wait_json],(error, results, fields)=>{
              if(error){
                throw error;
              }
            });
            message = "こんにちは" + profile.displayName + "さん\nあなたのuseridを登録しました。\nuseridは" + profile.userId + "です。";
            resolve(message);
            break;
          case "plane":
            rootPlane(req,profile,message_text,flag,temp,tempqs,target,message).then((message1)=>{
              console.log("355",message1);
              return message1;
            }).then((message)=>{
              resolve(message);
            }).catch((e)=>{throw e;});
            break;
          case "登録":
            (async ()=>{
              try{
                const results = await checkGp(message_text);
                if(results.length!=0){
                  message = await insertUsrList(profile,message_text,results);
                  resolve(message);
                }else{
                  message="存在しない問題番号です。";
                  connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
                  resolve(message);
                }
              }catch(e){
                console.log(e);
              }
            })();
            break;
          case "解除":
            if(message_text.match(/GP:.*/)){
              (async ()=>{
                try{
                  message_text = await message_text.substr(3);
                  console.log("378",message_text);
                  const results = await checkGp(message_text,true);
                  if(results.length!=0){
                    message = await deleteUsrList(profile,message_text,results);
                    resolve(message);
                  }else{
                    message="存在しないグループ番号です。";
                    connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
                    resolve(message);
                  }
                }catch(e){
                  console.log(e);
                }
              })();
            }else if(message_text.match(/QS:.*/)){
              (async ()=>{
                try{
                  message_text = await message_text.substr(3);
                  const results = await checkGp(message_text,false);
                  if(results.length!=0){
                    message = await deleteUsrList(profile,message_text,results);
                    resolve(message);
                  }else{
                    message="存在しない問題番号です。";
                    connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
                    resolve(message);
                  }
                }catch(e){
                  console.log(e);
                }
              })();
            }else{
              message="書式が正しくありません。ホームに戻ります。";
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              resolve(message);
            }
            break;
          case "ランキング":
              connection.query('select qs_id,lastday from qs_list where qs_id=?',[message_text],(error, results, fields)=>{
                if(error)throw error;
                if(results.length != 0){
                  var str="";
                  str +=results[0].lastday;
                  str = str.split(/\s/);
                  var ld="";
                  switch(str[1]){
                    case "Jan":
                      ld+="1月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "Feb":
                      ld+="2月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "Mar":
                      ld+="3月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "Apr":
                      ld+="4月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "May":
                      ld+="5月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "Jun":
                      ld+="6月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "Jul":
                      ld+="7月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "Aug":
                      ld+="8月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "Sep":
                      ld+="9月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "Oct":
                      ld+="10月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "Nov":
                      ld+="11月"+str[2]+"日"+str[4]+"時";
                      break;
                    case "Dec":
                      ld+="12月"+str[2]+"日"+str[4]+"時";
                      break;
                  }
                  message = message_text + "の最終実施日"+ld+"のランキングは\n";
                  (async ()=>{
                    const ranktable = 'rank_'+message_text;
                    message += await createRank(ranktable,results);
                    connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
                    resolve(message);
                  })();
                }else{
                  message="存在しない問題番号です。";
                  connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
                  resolve(message);
                }
              });
            break;
            
          case "確認受付":
            (async ()=>{
              try{
                console.log(message_text);
                if(message_text.match(/\w{33}:.+/gu)){
                  let targetUsrId = message_text.substr(0,33);
                  console.log("targetUsrId",targetUsrId);
                  let targetGpId = message_text.substr(34);
                  console.log("targetGpId",targetGpId);
                  message = await getAchievement(targetUsrId,targetGpId,profile,message);
                  resolve(message);
                }else{
                  message="書式が正しくありません。ホームに戻ります。";
                  connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
                  resolve(message);
                }
              }catch(e){
                console.log(e);
              }
            })();
            break;
            
          case "解説":
            (async ()=>{
              try{
                message = await getDescription (profile,message_text);
                connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
                resolve(message);
              }catch(e){
                console.log(e);
              }
            })();
            break;
          case "askAboutGP":
            console.log("463 in askAboutGP");
            if(message_text=="既存のGPに追加"){
              connection.query('update usrlist set flag="checkPreGPName" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message = "GP名を入力してください。";
              resolve(message);
            }else if(message_text=="新規GPから作成"){
              connection.query('update usrlist set flag="checkNewGPName" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message = "GP名を入力してください。";
              resolve(message);
            }else{
              message="不正な返信を受け取りましたhomeに戻ります。";
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              resolve(message);
            }
            break;
          case "checkPreGPName":
            if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else if(message_text=="新規GPの作成"){
              connection.query('update usrlist set flag="checkNewGPName" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="新規作成するGP名を入力してください。";
              resolve(message);
            }else{
              connection.query('select * from qs_gplist where GP=?',[message_text],(error,results,fields)=>{
                if(error) throw error;
                if(results.length==0){
                  message = "end";
                  sendMessage.send(req,messageTemplate.quickMessage(message_text+"は存在しないGP名です。続けて入力すると別の既存GPを指定できます。",["中止:homeに戻ります","新規GPの作成"]));
                  resolve(message);
                }else{
                  message="GP:"+message_text+"を選択しました。\n";
                  connection.query('select createusr from qs_gplist where GP=?',[message_text],(error,results,fields)=>{
                    if(error) throw error;
                    if(results[0].createusr == profile.userId){
                      message+="続けてQS名を入力してください。";
                      connection.query('update usrlist set flag="askNewQSName",temp=? where usr_id=?',[message_text,profile.userId],(error, results, fields)=>{if(error)throw error;});
                      resolve(message);
                    }else{
                      message+="続けてパスワードを入力してください。"
                      connection.query('update usrlist set flag="checkPreGPPassword",temp=? where usr_id=?',[message_text,profile.userId],(error, results, fields)=>{if(error)throw error;});
                      resolve(message);
                    }
                  })
                  resolve(message);
                }
              });
            }
            break;
          case "checkNewGPName":
            if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else if(message_text=='既存GPの指定'){
              connection.query('update usrlist set flag="checkPreGPName" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="指定するGP名を入力してください。";
              resolve(message);
            }else{
              connection.query('select * from qs_gplist where GP=?',[message_text],(error,results,fields)=>{
                if(error) throw error;
                if(results.length!=0){
                  message = "end";
                  sendMessage.send(req,messageTemplate.quickMessage(message_text+"は既に存在しているGP名です。続けて入力すると別の既存GPを指定できます。",["中止:homeに戻ります","既存GPの指定"]));
                  resolve(message);
                }else{
                  connection.query('insert into qs_gplist value(?,null,null,null,?)',[message_text,profile.userId],(error,results,fields)=>{
                    if(error) throw error;
                    message="GP:"+message_text+"を作成しました。\n";
                    message+="続けてGPのpasswordを入力してください。";
                  });
                  connection.query('update usrlist set flag="askNewGPPassword",temp=? where usr_id=?',[message_text,profile.userId],(error, results, fields)=>{if(error)throw error;
                    resolve(message);
                  });
                }
              });       
            }
            break;
          case "checkPreGPPassword":
            connection.query('select * from qs_gplist where GP=?',[temp],(error,results,fields)=>{
              if(error) throw error;
              if(message_text=="中止:homeに戻ります"){
                connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
                message="中止しました。homeに戻ります。";
                resolve(message);
              }else if(message_text=="再入力"){
                message="passeordを再入力してくだい。";
                resolve(message);
              }else{
                if(message_text==results[0].password){
                  message="確認しました。続けて作成する問のタイトルを入力してくだい。";
                  connection.query('update usrlist set flag="askNewQSName" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
                  resolve(message);
                }else{
                  message="end";
                  sendMessage.send(req,messageTemplate.quickMessage("passwordが一致しませんでした。",["中止:homeに戻ります","再入力"]));
                  resolve(message);
                }
              }
            });
            break;
          case "askNewGPPassword":
            if(message_text=="はい"){
              connection.query('update usrlist set flag="askNewGPTimer" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="作成するグループの規定時刻を設定してください。\n";
              message+="秒 分 時 日 月 曜日\nのフォーマットで時刻を指定してください。区切りは半角スペースです。\n";
              message+="複数指定は , を利用してください。毎時などをあらわすには*を使用します。\n";
              message+="曜日は\n日曜日:0,7\n月曜日:1\n火曜日:2\n水曜日:3\n木曜日:4\n金曜日:5\n土曜日:6\nで表します。\n";
              message+="例:12月の月,水,金曜日の00,06,12,18時の30分を指定する場合\n";
              message_text+="00 30 00,06,12,18 * 12 1,3,5\nとなります。";
              resolve(message);
            }else if(message_text=="訂正:再入力"){
              connection.query('update usrlist set flag="askNewGPPassword" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="passwordを入力してください";
              resolve(message);
            }else if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else{
              connection.query('update qs_gplist set password=? where GP=?',[message_text,temp],(error,results,fields)=>{
                if(error) throw error;
                message="end";
                sendMessage.send(req,messageTemplate.quickMessage(message_text+"をpasswordに設定しました間違いありませんか？",["はい","訂正:再入力","中止:homeに戻ります"]));
                resolve(message);
              });
            }
            break;
          case "askNewGPTimer":
            var pattern = /([0-5][0-9]|\*)(,[0-5][0-9])* ([0-5][0-9]|\*)(,[0-5][0-9])* (([01][0-9]|2[0-3])|\*)(,([01][0-9]|2[0-3]))* ((0[1-9]|[12][0-9]|3[01])|\*)(,(0[1-9]|[12][0-9]|3[01]))* (0[1-9]|1[0-2]|\*)(,(0[1-9]|1[0-2]))* ([0-7]|\*)(,[0-7])*/g;
            if(message_text=="はい"){
              message="確認しました。続けて作成する問のタイトルを入力してくだい。";
              connection.query('update usrlist set flag="askNewQSName" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              resolve(message);
            }else if(message_text=="訂正:再入力"){
              connection.query('update usrlist set flag="askNewGPTimer" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="時刻を入力してください。";
              resolve(message);
            }else if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else if(message_text.match(pattern)){
              connection.query('update qs_gplist set timer=? where GP=?',[message_text,temp],(error,results,fields)=>{
                if(error) throw error;
                message="end";
                sendMessage.send(req,messageTemplate.quickMessage(message_text+"をtimerに設定しました間違いありませんか？",["はい","訂正:再入力","中止:homeに戻ります"]));
                resolve(message);
              });
            }else{
              message="end";
              sendMessage.send(req,messageTemplate.quickMessage(message_text+"は不正な入力です。",["訂正:再入力","中止:homeに戻ります"]));
              resolve(message);
            }
            break;
          case "askNewQSName":
            if(message_text=="はい"){
              connection.query('update usrlist set flag="askqsformat" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="end";
              connection.query('insert into qs_ob(qs_id,password,createusr,must) values(?,"password",?,false)',[tempqs,profile.userId],(error, results, fields)=>{if(error)throw error;});
              sendMessage.send(req,messageTemplate.quickMessage("問題文の形式を選択してください。",["画像を送信","URLで送信","テキストで送信","texを送信"]));
              resolve(message);
            }else if(message_text=="訂正:再入力"){
              connection.query('select * from usrlist where usr_id=?',[profile.userId],(error,results, fields)=>{
                if(error) throw error;
                if(results[0].tempqs!=null){
                  connection.query('delete from qs_list where qs_id=?',[results[0].tempqs],(error,results,fields)=>{if(error) throw error;});
                }
              });
              connection.query('update usrlist set flag="askNewQSName" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="問のタイトルを入力してください。";
              resolve(message);
            }else if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else{
              connection.query('select * from qs_list where qs_id=?',[message_text],(error,results,fields)=>{
                if(error) throw error;
                if(results.length==0){
                  message="end";
                  connection.query('update usrlist set tempqs=? where usr_id=?',[message_text,profile.userId],(error, results, fields)=>{if(error)throw error;});
                  connection.query('select * from qs_gplist where GP=?',[temp],(error,results,fields)=>{
                    if(error) throw error;
                    //insert into qs_list values("test001","testgp1","0,30 * * * * *",null,false);
                    connection.query('insert into qs_list values(?,?,?,null,false)',[message_text,temp,results[0].timer],(error,results,fields)=>{
                      if(error) throw error;
                      sendMessage.send(req,messageTemplate.quickMessage(message_text+"でよろしいですか？",["はい","訂正:再入力","中止:homeに戻ります"]));
                      resolve(message);
                    });
                  });
                }else{
                  message="end";
                  sendMessage.send(req,messageTemplate.quickMessage(message_text+"は既に存在しています。",["訂正:再入力","中止:homeに戻ります"]));
                  resolve(message);
                }
              });
            }
            break;
          case "askqsformat":
            if(message_text=="画像を送信"){
              message=="準備中。ごめんね！！";
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              resolve(message);
            }else if(message_text=="URLで送信"){
              connection.query('update usrlist set flag="waiturl" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="有効な画像urlを送信してください。";
              resolve(message);  
            }else if(message_text=="テキストで送信"){
              message=="準備中。ごめんね！！";
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              resolve(message);
            }else if(message_text=="texを送信"){
              message=="準備中。ごめんね！！";
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              resolve(message);
            }else{
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="不正な操作です。中止しました。homeに戻ります。";
              resolve(message);
            }
            break;
          case "waiturl":
            if(message_text=="はい"){
              connection.query('update usrlist set flag="askCs" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="2~4の選択肢を改行区切りで入力してください。";
              resolve(message);
            }else if(message_text=="訂正:再入力"){
              message="https形式の有効なURLを入力してください。";
              resolve(message);
            }else if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else{
              if(message_text.match(/^https/)){
                message="end";
                connection.query('update qs_ob set qs_url=? where qs_id=?',[message_text,tempqs],(error, results, fields)=>{if(error)throw error;});
                sendMessage.send(req,messageTemplate.quickMessage(message_text+"\n確認できましたか？",["はい","訂正:再入力","中止:homeに戻ります"]));
                resolve(message);
              }else{
                message="end";
                sendMessage.send(req,messageTemplate.quickMessage("不正なURLです。https形式の有効なURLを入力してください。",["訂正:再入力","中止:homeに戻ります"]));
                resolve(message);
              }
            }
            break;
          /*case "waittex":
            if(message_text=="はい"){
              connection.query('update usrlist set flag="askCs" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="2~4の選択肢を改行区切りで入力してください。";
              resolve(message);
            }else if(message_text=="訂正:再入力"){
              message="tex形式のテキストを入力してください。";
              resolve(message);
            }else if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else{
              if(message_text.match(/^https/)){
                message="end";
                connection.query('update qs_ob set qs_url=? where qs_id=?',[message_text,tempqs],(error, results, fields)=>{if(error)throw error;});
                sendMessage.send(req,messageTemplate.quickMessage(message_text+"\n確認できましたか？",["はい","訂正:再入力","中止:homeに戻ります"]));
                resolve(message);
              }else{
                message="end";
                sendMessage.send(req,messageTemplate.quickMessage("不正なURLです。https形式の有効なURLを入力してください。",["訂正:再入力","中止:homeに戻ります"]));
                resolve(message);
              }
            }
            break;*/
          case "askCs":
             if(message_text=="はい"){
              connection.query('update usrlist set flag="askAns" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="正解の選択肢は何番ですか？";
              resolve(message);
            }else if(message_text=="訂正:再入力"){
              message="2~4の選択肢を改行区切りで入力してください。";
              resolve(message);
            }else if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else{
              if(message_text.match(/^.+(\n.+){1,3}/)){
                const cs = message_text.split('\n');
                if(cs.length==2){
                  const css = "選択肢1:"+cs[0]+"\n選択肢2:"+cs[1];
                  connection.query('update qs_ob set cs1=?,cs2=? where qs_id=?',[cs[0],cs[1],tempqs],(error, results, fields)=>{if(error)throw error;});
                  message="end";
                  sendMessage.send(req,messageTemplate.quickMessage(css+"\n確認できましたか？",["はい","訂正:再入力","中止:homeに戻ります"]));
                  resolve(message);
                }else if(cs.length==3){
                  const css = "選択肢1:"+cs[0]+"\n選択肢2:"+cs[1]+"\n選択肢3:"+cs[2];
                  connection.query('update qs_ob set cs1=?,cs2=?,cs3=? where qs_id=?',[cs[0],cs[1],cs[2],tempqs],(error, results, fields)=>{if(error)throw error;});
                  message="end";
                  sendMessage.send(req,messageTemplate.quickMessage(css+"\n確認できましたか？",["はい","訂正:再入力","中止:homeに戻ります"]));
                  resolve(message);
                }else if(cs.length==4){
                  const css = "選択肢1:"+cs[0]+"\n選択肢2:"+cs[1]+"\n選択肢3:"+cs[2]+"\n選択肢4:"+cs[3];
                  connection.query('update qs_ob set cs1=?,cs2=?,cs3=?,cs4=? where qs_id=?',[cs[0],cs[1],cs[2],cs[3],tempqs],(error, results, fields)=>{if(error)throw error;});
                  message="end";
                  sendMessage.send(req,messageTemplate.quickMessage(css+"\n確認できましたか？",["はい","訂正:再入力","中止:homeに戻ります"]));
                  resolve(message);
                }else{
                  message="end";
                  sendMessage.send(req,messageTemplate.quickMessage("不正な入力です。2~4の選択肢を改行区切りで入力してください。",["訂正:再入力","中止:homeに戻ります"]));
                  resolve(message);
                }
                
              }else{
                message="end";
                sendMessage.send(req,messageTemplate.quickMessage("不正な入力です。2~4の選択肢を改行区切りで入力してください。",["訂正:再入力","中止:homeに戻ります"]));
                resolve(message);
              }
            }
            break;
          case "askAns":
            if(message_text=="はい"){
              connection.query('update usrlist set flag="askDes" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="解説文またはURLを入力してください。";
              resolve(message);
            }else if(message_text=="訂正:再入力"){
              message="正解の選択肢は何番ですか？";
              resolve(message);
            }else if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else if(message_text.match(/[1-4]/)){
              connection.query('select * from qs_ob where qs_id=?',[tempqs],(error, results, fields)=>{
                if(error)throw error;
                if(message_text=="1"){
                  connection.query('update qs_ob set CorrectAns=? where qs_id=?',[1,tempqs],(error, results, fields)=>{if(error)throw error;});
                }else if(message_text=="2"){
                  connection.query('update qs_ob set CorrectAns=? where qs_id=?',[2,tempqs],(error, results, fields)=>{if(error)throw error;});
                }else if(message_text=="3"){
                  connection.query('update qs_ob set CorrectAns=? where qs_id=?',[3,tempqs],(error, results, fields)=>{if(error)throw error;});
                }else if(message_text=="4"){
                  connection.query('update qs_ob set CorrectAns=? where qs_id=?',[4,tempqs],(error, results, fields)=>{if(error)throw error;});
                }
                connection.query('select * from qs_ob where qs_id=?',[tempqs],(error, results, fields)=>{
                  if(error) throw error;
                  message="end";
                  var ans;
                  switch(results[0].CorrectAns){
                    case "1":
                      ans = results[0].cs1;
                      break;
                    case "2":
                      ans = results[0].cs2;
                      break;
                    case "3":
                      ans = results[0].cs3;
                      break;
                    case "4":
                      ans = results[0].cs4;
                      break;
                  }
                  sendMessage.send(req,messageTemplate.quickMessage(ans+"\nが正解でいいですか？",["はい","訂正:再入力","中止:homeに戻ります"]));
                  resolve(message);
                })
              });
            }else{
              message="end";
              sendMessage.send(req,messageTemplate.quickMessage("不正な入力です。入力しなおしてください。",["訂正:再入力","中止:homeに戻ります"]));
              resolve(message);
            }
            break;
          case "askDes":
            if(message_text=="はい"){
              const rank = "rank_"+tempqs;
              connection.query('create table ??(usr_id varchar(35),usr_name varchar(40),time datetime(6),penalty int(2));',[rank],(error,results,fields)=>{if(error) throw error;});
              connection.query('update usrlist set flag="askMust" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="end";
              sendMessage.send(req,messageTemplate.quickMessage("回答回数は？",["一度切り","正解するまで","中止:homeに戻ります"]));
              resolve(message);
            }else if(message_text=="訂正:再入力"){
              message="解説文またはURLを入力してください。";
              resolve(message);
            }else if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else{
              message="end";
              sendMessage.send(req,messageTemplate.quickMessage(message_text+"\nを解説として登録します。",["はい","訂正:再入力","中止:homeに戻ります"]));
              resolve(message);
            }
            break;
          case "askMust":
            if(message_text=="一度切り"){
              connection.query('update usrlist set flag="test" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="end";
              sendMessage.send(req,messageTemplate.quickMessage("testしますか？",["はい","中止:homeに戻ります"]));
              resolve(message);
              resolve(message);
            }else if(message_text=="正解するまで"){
              connection.query('update qs_ob set must=true where qs_id=?',[tempqs],(error,results,fields)=>{if(error) throw error;});
              message="end";
              connection.query('update usrlist set flag="test" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              sendMessage.send(req,messageTemplate.quickMessage("testしますか？",["はい","中止:homeに戻ります"]));
              resolve(message);
            }else if(message_text=="中止:homeに戻ります"){
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              message="中止しました。homeに戻ります。";
              resolve(message);
            }else{
              message="end";
              sendMessage.send(req,messageTemplate.quickMessage("不正な入力です。回答回数を設定してください。",["一度切り","正解するまで","中止:homeに戻ります"]));
              resolve(message);
            }
            break;
          case "test":
            if(message_text=="はい"){
              connection.query('select * from qs_ob where qs_id=?',[tempqs],(err,results,fields)=>{
                if(err) throw err;
                let qs_ob = results;
                //console.log(results);
                connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
                push(qs_ob,[profile.userId]);
              });
              message="end";
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              resolve(message);
            }else{
              message="作問を終了します。homeにもどります。";
              connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
              resolve(message);
            }
            break;
          case "編集":
            message = "編集";
            resolve(message);
            break;
          case "QS":
            break;
          default:
            message = planemessage;
            connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
            resolve(message);
            break;
        }
    });
}

//登録、解除関係
function checkGp(message_text,gp){
  return new Promise((resolve)=>{
    if(gp){
      connection.query('select * from qs_gplist where GP=?',[message_text],(error,results,fields)=>{
        if(error) throw error;
        resolve(results);
      });
    }else{
      connection.query('select * from qs_list where qs_id=?',[message_text],(error,results,fields)=>{
        if(error) throw error;
        resolve(results);
      });
    }
  });
}

function checkUsrGpList(profile,results){
  console.log("checkUsrGpList",results);
  return new Promise((resolve)=>{
    try{
      connection.query('select * from usrgp_list where GP=? and usr_id=?',[results[0].GP,profile.userId],(error,results,fields)=>{
      if(error) throw error;
      resolve(results);
    });
    }catch(e){
      console.log(e);
    }
  });
}

async function insertUsrList(profile,message_text,results){
  try{
    const results2 = await checkUsrGpList(profile,results);
    if(results2.length==0){
      connection.query('select * from ?? where GP=?',["qs_list",results[0].GP],(error,results,fields)=>{
        if(error) throw error;
        for(let i = 0; i < results.length; i++){
          connection.query('insert into ?? values(?,?,NULL,0)',["rank_"+results[0].qs_id,profile.userId,profile.displayName],(error,results,fields)=>{if(error) throw error;});
        }
      });
      connection.query('insert into ?? values(?,?)',["usrgp_list",profile.userId,results[0].GP],(error,results,fields)=>{if(error) throw error;});
      connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      const message = "問題"+message_text+"を含むグループ"+results[0].GP+"に登録しました。";
      return message;
    }else{
      connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      const message = "問題"+message_text+"を含む問題グループ"+results[0].GP+"には既に登録済です。";
      return message;
    }
  }catch(e){
    console.log(e);
  }
}

async function deleteUsrList(profile,message_text,results,gp){
  try{
    const results2 = await checkUsrGpList(profile,results);
    if(results2.length!=0){
      connection.query('select * from ?? where GP=?',["qs_list",results[0].GP],(error,results,fields)=>{
        if(error) throw error;
        for(let i = 0; i < results.length; i++){
          connection.query('delete from ?? where usr_id=?',["rank_"+results[0].qs_id,profile.userId],(error,results,fields)=>{if(error) throw error;});
        }
      });
      connection.query('delete from ?? where usr_id=? and GP=?',["usrgp_list",profile.userId,results[0].GP],(error,results,fields)=>{if(error) throw error;});
      connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      if(gp){
        const message = "グループ"+results[0].GP+"の登録を解除しました。";
        return message;
      }else{
        const message = "問題"+message_text+"を含むグループ"+results[0].GP+"の登録を解除しました。";
        return message;
      }
    }else{
      connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
      if(gp){
        const message = "問題グループ"+results[0].GP+"には登録されていません。";
        return message;
      }else{
        const message = "問題"+message_text+"を含む問題グループ"+results[0].GP+"には登録されていません。";
        return message;
      }
    }
  }catch(e){
    log(e);
  }
}

//ランキング関係
function createRank(ranktable,results){
  return new Promise((resolve)=>{
    try{
      connection.query('select * from ?? where time is not null and time>=? order by time',[ranktable,results[0].lastday],(error, results, fields)=>{
        if(error)throw error;
        if(results.length!=0){
          var message = "";
          for(let i=0;i<results.length;i++){
            var str="";
            str +=results[i].time;
            str = str.split(/\s/);
            var ld="";
            switch(str[1]){
              case "Jan":
                ld+="1月"+str[2]+"日"+str[4];
                break;
              case "Feb":
                ld+="2月"+str[2]+"日"+str[4];
                break;
              case "Mar":
                ld+="3月"+str[2]+"日"+str[4];
                break;
              case "Apr":
                ld+="4月"+str[2]+"日"+str[4];
                break;
              case "May":
                ld+="5月"+str[2]+"日"+str[4];
                break;
              case "Jun":
                ld+="6月"+str[2]+"日"+str[4];
                break;
              case "Jul":
                ld+="7月"+str[2]+"日"+str[4];
                break;
              case "Aug":
                ld+="8月"+str[2]+"日"+str[4];
                break;
              case "Sep":
                ld+="9月"+str[2]+"日"+str[4];
                break;
              case "Oct":
                ld+="10月"+str[2]+"日"+str[4];
                break;
              case "Nov":
                ld+="11月"+str[2]+"日"+str[4];
                break;
              case "Dec":
                ld+="12月"+str[2]+"日"+str[4];
                break;
            }
            message+=(i+1)+"位"+results[i].usr_name+"\n";
            message+="タイム:"+ld+"\n";
          }
          resolve(message);
        }else{
          const message = "まだランキングが存在しません。";
          resolve(message);
        }
      });
    }catch(e){
      console.log(e);
    }
  });
}

//成績確認関係
function getAchievement(targetUsrId,targetGpId,profile,message){
  return new Promise((resolve)=>{
    connection.query('select qs_id,lastday from qs_list where GP = ? order by lastday',[targetGpId],(error,results,fields)=>{
      if(error)throw error;
      if(results.length!=0){
        for(let i=0;i<results.length;i++){
          console.log("成績 i",i);
          console.log(results[i]);
          const ranktable = 'rank_'+results[i].qs_id;
          console.log("ランクテーブル",ranktable);
          const lastday = results[i].lastday;
          connection.query('select * from ?? where usr_id=?',[ranktable,targetUsrId],(error,results,fields)=>{
            if(error)throw error;
            var str="";
            str +=lastday;
            str = str.split(/\s/);
            var ld="";
            switch(str[1]){
              case "Jan":
                ld+="1月"+str[2]+"日"+str[4];
                break;
              case "Feb":
                ld+="2月"+str[2]+"日"+str[4];
                break;
              case "Mar":
                ld+="3月"+str[2]+"日"+str[4];
                break;
              case "Apr":
                ld+="4月"+str[2]+"日"+str[4];
                break;
              case "May":
                ld+="5月"+str[2]+"日"+str[4];
                break;
              case "Jun":
                ld+="6月"+str[2]+"日"+str[4];
                break;
              case "Jul":
                ld+="7月"+str[2]+"日"+str[4];
                break;
              case "Aug":
                ld+="8月"+str[2]+"日"+str[4];
                break;
              case "Sep":
                ld+="9月"+str[2]+"日"+str[4];
                break;
              case "Oct":
                ld+="10月"+str[2]+"日"+str[4];
                break;
              case "Nov":
                ld+="11月"+str[2]+"日"+str[4];
                break;
              case "Dec":
                ld+="12月"+str[2]+"日"+str[4];
                break;
            }
            console.log(ld);
            if(results[0].time >= lastday){
              var str2 = "";
              str2 +=results[0].time;
              str2 = str2.split(/\s/);
              var ld2="";
              switch(str2[1]){
                case "Jan":
                  ld2+="1月"+str2[2]+"日"+str2[4];
                  break;
                case "Feb":
                  ld2+="2月"+str2[2]+"日"+str2[4];
                  break;
                case "Mar":
                  ld2+="3月"+str2[2]+"日"+str2[4];
                  break;
                case "Apr":
                  ld2+="4月"+str2[2]+"日"+str2[4];
                  break;
                case "May":
                  ld2+="5月"+str2[2]+"日"+str2[4];
                  break;
                case "Jun":
                  ld2+="6月"+str2[2]+"日"+str2[4];
                  break;
                case "Jul":
                  ld2+="7月"+str2[2]+"日"+str2[4];
                  break;
                case "Aug":
                  ld2+="8月"+str2[2]+"日"+str2[4];
                  break;
                case "Sep":
                  ld2+="9月"+str2[2]+"日"+str2[4];
                  break;
                case "Oct":
                  ld2+="10月"+str2[2]+"日"+str2[4];
                  break;
                case "Nov":
                  ld2+="11月"+str2[2]+"日"+str2[4];
                  break;
                case "Dec":
                  ld2+="12月"+str2[2]+"日"+str2[4];
                  break;
            }
              message+=ld+" ○\n";
              message+="回答時刻:"+ld2+"\n";
            }else{
              message+=ld+" X\n";
            }
          });
        }
        connection.query('select * from usrlist where usr_id=?',[targetUsrId],(error,results,fields)=>{
          if(error) throw error;
          console.log(results);
          const name = results[0].usr_name;
          connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{
            if(error)throw error;
            message = name+"さんの"+targetGpId+"の成績は\n"+message;
            resolve(message);
          });
        });
      }else{
        connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{
          if(error) throw error;
          message="存在しないGP番号です。"
          resolve(message);
        });
      }
    });
  });
    
}

//解説関係
function getDescription (profile,message_text){
  return new Promise((resolve,reject)=>{
    connection.query('select Description from qs_ob where qs_id=?',message_text,(error,results,fields)=>{
      if(error) throw error;

      if(results.length!=0){
        resolve("解説\n"+results[0].Description);
      }else{
        connection.query('update usrlist set flag="plane" where usr_id=?',[profile.userId],(error, results, fields)=>{if(error)throw error;});
        resolve("存在しない問題番号です。");
      }
    });
  });
}

function setTargetArray(){
  var wait = [];
  var wait_json = JSON.stringify(wait);
  connection.query('update usrlist set target = ?',[wait_json],(error,results,fields)=>{if(error) throw error;});
}

function testset(){
  setTargetArray();
  const rootUsr = "U3aa127f38f35ddee3962757fe0d50eba";
  var wait = [];
  var wait_json = JSON.stringify(wait);
  connection.query('update usrlist set target = ? where usr_id=?',[wait_json,rootUsr],(error,results,fields)=>{if(error) throw error;});
}

async function usrlistTargetUpdate(target,qs_id,usrid){
  try{
    var wait = await jsonParse(target);
    console.log("wait",wait);
    await targetPush(wait,qs_id);
    var wait_json = await toJson(wait);
    console.log("wait_json",wait_json);
    connection.query('update usrlist set target=? where usr_id=?',[wait_json,usrid],(error,results,fields)=>{if(error) throw error;});
  }catch(e){
    console.log(e);
  }
}

async function toJson(data){
  try{
    var json = JSON.stringify(data);
    return json;
  }catch(e){
    log(e);
  }
}

async function jsonParse(json){
  try{
    var data = JSON.parse(json);
    return  data;
  }catch(e){
    log(e);
  }
}

async function targetPush(data,text){
  try{
    data.push(text);
    return data;
  }catch(e){
    console.log(e);
  }
}

async function targetPop(data){
  try{
    data.pop();
    return data;
  }catch(e){
    console.log(e);
  }
}

const now = new Date();
let sec = now.getSeconds();
let hour = now.getHours();
let min = now.getMinutes();
sec++;
if(sec ==60){
  sec = 5;
  min++;
}
if(min == 59){
  min = 0;
  hour++;
}

function HaishinTest(){
  return new Promise((resolve)=>{
    connection.query('insert into qs_gplist values("配信testgp",?,null,"password","U3aa127f38f35ddee3962757fe0d50eba")',[sec+" "+min+" "+hour+" * * *"],(error,results,fields)=>{
      if(error) throw error;
    });
    const m = "配信テストセット"
    resolve(m);
  });
}

app.listen(app.get('port'), ()=> {
    console.log('Node app is running');
    testset();
    HaishinTest().then((m)=>{
      console.log(m);
      setTimer();
    }).catch((e)=>{
      console.log(e);
    });
});

/*cron.schedule(sec+' '+min+' '+hour+' * * *',()=>{
  connection.query('select * from qs_ob where qs_id="test"',(error, results, fields)=>{
    console.log(results);
    if(error) throw error;
    const qs_ob = results;
    const usr_id = ["U3aa127f38f35ddee3962757fe0d50eba"];
    push(qs_ob,usr_id);
  });
});*/

