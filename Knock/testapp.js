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

function ImgSend(title, imageUrl, choices, answers){
  return new Promise((resolve)=>{
    const ob = messageTemplate.customQuestionMessage(title, imageUrl, choices, answers);
    resolve(ob);
  });
}

app.post('/callback',(req,res)=>{
  const event_data = req.body.events[0];
  const message_text = event_data.message.text;
  console.log(message_text);
  const title = "確認できましたか？";
  const imageUrl = "https://chart.apis.google.com/chart?chs=657x359&cht=tx&chl="+message_text.trim();
  console.log(imageUrl);
  const choices = ["はい","訂正:再入力","中止:homeに戻ります"];
  const answers = ["はい","訂正:再入力","中止:homeに戻ります"];
  ImgSend(title, imageUrl, choices, answers).then((ob)=>{
    console.log(ob);
    sendMessage.send(req,ob);
  }).catch((e)=>{
    console.log(e);
    sendMessage.send(req,messageTemplate.quickMessage("不正な入力です。",["訂正:再入力","中止:homeに戻ります"]));
  })
});

app.listen(app.get('port'), ()=> {
  console.log('Node app is running');
});
