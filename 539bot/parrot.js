// use Express
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');

// create LINE SDK config from env variables
const lineconfig = {
  channelAccessToken: 'dvLM1fbPEISIwrO5AMIga2wktVeR1PHVG/BhETbrKYl6uNp3swME7x8oPnbHJGnQcsGNHev6mKF4SOI52Blj8spZjBkJUN9Q2qTVKiKXfnA67jWJb5LEwONSgHCZ/UQXzljh+CrkrMVyd7zMzjLJXgdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'c63cda167f5859ceda5cde822a5a7b5f'
};

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/callback', (req, res) => {
 console.log(req.body);

  // check X-Line-Signature
  
  var options = {
    url: 'https://api.line.me/v2/bot/message/reply',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + lineconfig.channelAccessToken
    },
    json:{
     replyToken: req.body.events[0].replyToken,
     messages: [    {type:'text',
              text:req.body.events[0].message.text}] 
    }
  };
  request(options, function(error, response, body){
//  console.log(error);
//  console.log(response);
//  console.log(body);
  });
});

// listen on port
const port = 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});