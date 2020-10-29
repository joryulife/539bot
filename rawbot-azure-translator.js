const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const line = require('./lineinfo.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/callback', (reqFromLINE, resToLINE) => {
  console.log("===resFromLINE===");console.log(reqFromLINE);

  // check X-Line-Signature
  if(line.config.validate_signature(req.headers['X-Line-Signature'],req.body)){
     console.log('X-Line-Signature validation error');
     return;
  }


  var textToLINE=[];
  var urlAzureTranslator='https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&to=en';

  var textFromLINE=reqFromLINE.body.events[0].message.text;
  var reqToAzure = {
     url: urlAzureTranslator,
     method: 'POST',
     headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Ocp-Apim-Subscription-Key': '<Your Key>'},
    json:[{
       "Text": textFromLINE
     }]
  };
  console.log("===dataToAzure===");  console.log(reqToAzure);

  request(reqToAzure, (errFromAzure, resFromAzure, bodyFromAzure)=>{
    console.log("===res FromAzure===");console.log(resFromAzure);
    console.log("===body FromAzure===");console.log(bodyFromAzure);

    textToLINE=[{type:"text", text:bodyFromAzure[0].translations[0].text}];

    var reqToLINE = {
      url: 'https://api.line.me/v2/bot/message/reply',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + line.config.channelAccessToken
      },
      json:{
       replyToken: reqFromLINE.body.events[0].replyToken,
       messages: textToLINE
      }
    };

    console.log("===reqToLINE===");  console.log(reqToLINE);
    request(reqToLINE, (errFromLINE, resFromLINE, bodyFromLINE)=>{
      console.log("===resFromLINE===");console.log(resFromLINE);
    });
  });
});

// listen on port
const port = 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});