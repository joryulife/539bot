const express = require('express');
const canvas = require('canvas');//Webページ上の描画 https://www.npmjs.com/package/canvas
const fs = require('fs'); // (CA上の)ファイルの読み書き
const hosturl = "https://539bot-joryulife.codeanyapp.com"; // Rewrite here

const request = require('request');
const bodyParser = require('body-parser');
const line = require('./lineinfo.js');
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.get('/image/pict.png', (req, res) => {
    console.log(req);
    fs.readFile('/home/cabox/image/pict.png',(err,data)=>{
        console.log(err);
        res.setHeader('Content-Type','image/png');
        res.send(data);
    });
});

app.post('/callback', (reqFromLINE,resToLINE)=>{

    // check X-Line-Signature
    if(line.config.validate_signature(reqFromLINE.headers['X-Line-Signature'],reqFromLINE.body)){
        console.log('X-Line-Signature validation error');
        return;
    }  

    const width = 120;
    const height = 90;

    const cvs = canvas.createCanvas(width, height);
    const context = cvs.getContext('2d');

    context.fillStyle = '#ffffff'; //色
    context.fillRect(0, 0, width, height);

    context.strokeStyle='#ffff00';
    context.fillStyle = '#00ffff'; //色
    context.beginPath();
    context.arc(width/2,height/2,height/2,0,2*Math.PI,false);
    context.fill();

    context.font = '20px Menlo';
    context.fillStyle = '#000000';
    const text = reqFromLINE.body.events[0].message.text;
    context.fillText(text, 0, 45);

    var b64 = cvs.toDataURL().split( ',' )[1];
    var buf = new Buffer.from( b64, 'base64' );
    fs.writeFile('/home/cabox/image/pict.png',buf,(err)=>{
        console.log("file written");
        var reqToLINE = {
            url: 'https://api.line.me/v2/bot/message/reply',
            method: 'POST',
            headers: {
                  'Content-Type': 'application/json',
                  'Authorization': "Bearer "+line.config.channelAccessToken
                  },
            json:{
                  replyToken: reqFromLINE.body.events[0].replyToken,
                  messages: 
                    [
                        {
                            type:"image", 
                            originalContentUrl: hosturl + "/image/pict.png",
                            previewImageUrl: hosturl + "/image/pict.png"
                        }
                    ]
            }
        };
                
        request(reqToLINE, (err,resFromLINE,body)=>{
            //console.log("request to LINE done");
            console.log(resFromLINE);
            //console.log(resFromLINE);
        });
    });
});

// listen on port
const port = 3000;
app.listen(port, () => {
  console.log(`listening on ${port}`);
});