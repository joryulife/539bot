// use Express and cheerio
const express = require('express');
const bodyParser = require('body-parser');
const request = require('request');
const cheerio = require('cheerio');
const line = require('./lineinfo.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.post('/callback', (req, res) => {
  console.log(req);

  // check X-Line-Signature
  if(line.config.validate_signature(req.headers['X-Line-Signature'],req.body)){
    console.log('X-Line-Signature validation error');
    return;
  }

  var picurl="";
  /*var namelist = new Array(48);
  for(let i = 0; i < 48; i++){
    namelist[i] = new Array(10).fill("");
  }*/
  var namelist = "";
  var m=[]; // message sent to LINE
  
  var reqToMember=
    {
        url:'https://www.keyakizaka46.com/s/k46o/search/artist',
        method: 'GET'
    };

  request(reqToMember, (error, response, body) => {
    if (error) {   
        console.error(error);
    }
    try {
        const $ = cheerio.load(body,{decodeEntities: false});    //bodyの読み込み
        console.log(req.body.events[0].message.text)
        if(req.body.events[0].message.text.indexOf("メンバー") > -1){
          $('.name' ).each((i, elme) => {
            namelist += $(elme).parent().find('name').html();
          })
          m = [ {type:text, text:namelist}]
        } else{
          $('.name' ).each((i, elem) => {   //'name'クラスの要素に対して処理実行(このHTMLではp要素で, 中にはメンバー名が書かれている)
              if( $(elem).html().match(req.body.events[0].message.text) ){
               picurl=$(elem).parent().find('img').attr('src');      //picurlにnameクラス親の子のimg要素のsrc属性値を保存
              }
          })
          //console.log(picurl);

          if( picurl==""){
            m=[ {type:"text", text:"No such member"}];
          } else {
            m=[ {type:"image", previewImageUrl: picurl, originalContentUrl: picurl}];
          }
        }

        var reqToLINE = {
          url: 'https://api.line.me/v2/bot/message/reply',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + line.config.channelAccessToken
          },
          json:{
            replyToken: req.body.events[0].replyToken,
            messages: m
          }   
         };

         request(reqToLINE, (error, response, body)=>{
           //console.log(body);
           if(error){
               console.log(error);
           }
         });   
    } catch (e){
      console.log(e);
    }
  });
});

// listen on port
const port = 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});