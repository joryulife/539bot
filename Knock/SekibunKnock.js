const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const line = require('./lineinfo.js');
const messageTemplate = require('./messageTemplate.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
var reply2 = {};
reply2.type='text';

app.post('/callback',Knock);
function Knock (req, res) {
  if(line.config.validate_signature(req.headers['X-Line-Signature'],req.body)){
     console.log('X-Line-Signature validation error');
     return;
  }
  var received_text=req.body.events[0].message.text;
  console.log(received_text);
  
  if(received_text == "問題"){
    //flexメッセージを使う
    var title = "問題";
    var imageUrl = "https://noschool.asia/wp-content/uploads/2017/12/IMG_20171222_220633.jpg";
    var choices = ["1/2", "1/3", "1/4", "0"];
    var answers = ["1/2", "1/3", "1/4", "0"];
    var reply = {
          "type": "flex",
          "altText": "this is a flex message",
          "contents": customFunc(title, imageUrl, choices, answers)
        }
    console.log(reply);
    let options = {
      url: 'https://api.line.me/v2/bot/message/reply',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + line.config.channelAccessToken
      },
      json:{
       replyToken: req.body.events[0].replyToken,
       messages: [reply]
      }
    };
  request(options, function(error, response, body){});
  }else if(received_text == "Aさん"){
    reply2.text = "Aさんの近状は\n11/12:X\n11/13:○\n11/14:○\n11/15:○\n11:16:X\n11/17:X\n11/18:○\nです。\n達成率は57%です。";
    options = {
      url: 'https://api.line.me/v2/bot/message/reply',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + line.config.channelAccessToken
      },
      json:{
       replyToken: req.body.events[0].replyToken,
       messages: [reply2]
      }
    };
  request(options, function(error, response, body){});
  }else {
    reply2.text = "2020/11/19のランキングは\n一位：Aさん\n二位:Bさん\n３位：Cさん";
    options = {
      url: 'https://api.line.me/v2/bot/message/reply',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + line.config.channelAccessToken
      },
      json:{
       replyToken: req.body.events[0].replyToken,
       messages: [reply2]
      }
    };
  request(options, function(error, response, body){});
  }
}

// listen on port
const port = 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});

function customFunc(title, imageUrl, qustions, answers) {
  return {
    "type": "bubble",
    "hero": {
      "type": "image",
      "url": imageUrl,
      "size": "full",
      "aspectRatio": "20:13",
      "aspectMode": "cover"
    },
    "body": {
      "type": "box",
      "layout": "vertical",
      "spacing": "md",
      "action": {
        "type": "uri",
        "uri": "https://linecorp.com"
      },
      "contents": [{
          "type": "text",
          "wrap": true,
          "text": title,
          "size": "md"
        },
        {
          "type": "box",
          "layout": "baseline",
          "contents": [{
              "type": "text",
              "text": "1",
              "flex": 1
            },
            {
              "type": "text",
              "text": qustions[0],
              "weight": "bold",
              "flex": 6
            }
          ]
        },
        {
          "type": "box",
          "layout": "baseline",
          "contents": [{
              "type": "text",
              "text": "2",
              "flex": 1
            },
            {
              "type": "text",
              "text": qustions[1],
              "weight": "bold",
              "flex": 6
            }
          ]
        },
        {
          "type": "box",
          "layout": "baseline",
          "contents": [{
              "type": "text",
              "text": "3",
              "flex": 1
            },
            {
              "type": "text",
              "text": qustions[2],
              "weight": "bold",
              "flex": 6
            }
          ]
        },
        {
          "type": "box",
          "layout": "baseline",
          "contents": [{
              "type": "text",
              "text": "4",
              "flex": 1
            },
            {
              "type": "text",
              "text": qustions[3],
              "weight": "bold",
              "flex": 6
            }
          ]
        }
      ]
    },
    "footer": {
      "type": "box",
      "layout": "horizontal",
      "contents": [{
          "type": "button",
          "style": "primary",
          "color": "#30A9DE",
          "action": {
            "type": "message",
            "label": "1",
            "text": answers[0]
          }
        },
        {
          "type": "button",
          "style": "primary",
          "color": "#EFDC05",
          "action": {
            "type": "message",
            "label": "2",
            "text": answers[1]
          }
        },
        {
          "type": "button",
          "style": "primary",
          "color": "#E53A40",
          "action": {
            "type": "message",
            "label": "3",
            "text": answers[2]
          }
        },
        {
          "type": "button",
          "style": "primary",
          "color": "#5CAB7D",
          "action": {
            "type": "message",
            "label": "4",
            "text": answers[3]
          }
        }
      ]
    }
  }
}