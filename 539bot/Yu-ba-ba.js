const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const line = require('./lineinfo.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var count = 0;

app.post('/callback',keiyaku);
function keiyaku (req, res) {
  if(line.config.validate_signature(req.headers['X-Line-Signature'],req.body)){
     console.log('X-Line-Signature validation error');
     return;
  }
  var received_text=req.body.events[0].message.text;
  console.log(received_text);
  console.log(count);
  var reply={};
  reply.type='text';
  
  if(received_text == 'ここで働かせてください'){
    if(count == 0){
      reply.text="バカなことを言うんじゃないよ";
      count = 1;
    }else {
      reply.text = "黙りな！！";
      count = 1;
    }
  }else if(received_text == 'ここで働かせてください！！'){
      if(count == 1){
        reply.text="契約書だよ。そこに名前を書きな";
        count = 2;
      }else {
        reply.text="黙りな！！";
        count = 1;
      }
  }else{
    if(count == 2){
      reply.text="フン。" + received_text + "というのかい贅沢な名だねぇ。";
      var random = Math.round(Math.random()*(received_text.length));
      console.log(random);
      newname = received_text[random];
      reply.text = reply.text + "今からお前の名前は" + newname + "だ。いいかい、" + newname + "だよ。分かったら返事をするんだ、" + newname + "!!";
      count = 0;
    }else{
      reply.text = "なんだいいったい";
    }
  }
  
  var options = {
    url: 'https://api.line.me/v2/bot/message/reply',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + line.config.channelAccessToken
    },
    json:{
     replyToken: req.body.events[0].replyToken,
     messages: [ reply ]
    }
  };
  request(options, function(error, response, body){});
}

// listen on port
const port = 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});