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

async function tojson(data){
  try{
    console.log("in tojason");
    var json = JSON.stringify(data);
    console.log(json);
    return json;
  }catch(e){
    log(e);
  }
}

async function rejson(json){
  try{
    console.log("in rejson");
    var data = JSON.parse(json);
    console.log(data);
    return  data;
  }catch(e){
    log(e);
  }
}

async function jpush(data,text){
  try{
    console.log("in jpush");
    data.push(text);
    return data;
  }catch(e){
    console.log(e);
  }
}

async function jpop(data){
  try{
    console.log("in jpop");
    data.pop();
    return data;
  }catch(e){
    console.log(e);
  }
}

async function test(wait){
    console.log("in");
    var json = await tojson(wait);
    wait = await rejson(json);
    await jpush(wait,"111");
    await jpush(wait,"222");
    json = await tojson(wait);
    wait = await rejson(json);
    await jpop(wait);
    const index = wait.indexOf("111");
    console.log(index);
    json = await tojson(wait);
    wait = await rejson(json);
  }

app.set('port',3000);
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());

app.listen(app.get('port'), ()=> {
  console.log('Node app is running');
  var wait = [];
  test(wait);
});
