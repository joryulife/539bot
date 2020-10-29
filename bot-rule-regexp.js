// use Express
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const line = require('./lineinfo.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/callback', (req, res) => {
console.log(req.body);

  // check X-Line-Signature
  if(line.config.validate_signature(req.headers['X-Line-Signature'],req.body)){
     console.log('X-Line-Signature validation error');
     return;
  }
  
  var received=req.body.events[0].message.text;
  var reply;
  
  if((price=received.match(/〒/))!=null){
    received = received.replace(/〒/g,"");
    received = received.trim();
    received = received.replace(/^[0-9０-９]{3}-?[0-9０-９]{4}/g,"");
    received = received.trim();
    reply=[{type:'text',text:received}];
    // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/match
  }else{
    reply=[{type:'text',text:received}];
       // https://developer.mozilla.org/ja/docs/Web/JavaScript/Reference/Global_Objects/String/replace
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
     messages: reply
    }
  };
  request(options, function(error, response, body){
    console.log(error);
    console.log(response);
//  console.log(body);
  });
});

// listen on port
const port = 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});