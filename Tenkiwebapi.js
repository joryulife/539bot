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

  var reply=[];
  var urlcity='https://weather.tsukumijima.net/api/forecast?city=250010'
  
  var webapioptions = {
     url: urlcity,
     method: 'GET',
     json: true
  };
  
  request(webapioptions, function(error, response, body){
    reply=[{type:"text", text:body.location.city + 'の' + body.forecasts[0].dateLabel + 'は' + body.forecasts[0].telop}];
    
    var lineoptions = {
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

    request(lineoptions, function(error, response, body){
      console.log(body);
    });    
  });
});

// listen on port
const port = 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});