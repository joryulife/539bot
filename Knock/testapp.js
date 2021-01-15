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

app.get('/*.(png|bmp|jpg|jpeg)',(req,res)=>{
  console.log("AAAAAAAAAAAAAAAAAAAAAAAA");
  console.log(req);
  //const message = req.body.events[0].message.text;
  /*fs.readFile('./IMG/',(err,data)=>{
    if(err) throw err;
    console.log("49 sendimage");
    res.type('png');
    res.send(data);
  })*/
});

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
