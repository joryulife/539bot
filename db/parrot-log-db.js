//point browser to https://ナントカ-ナントカ.codeanyapp.com/listlog 
const express = require('express');
const request = require('request');
const bodyParser = require('body-parser');
const ejs = require('ejs');
const line = require('./539bot/lineinfo.js');
const mysql = require('mysql');
const db = require('./dbinfo.js');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());


var connection=mysql.createConnection(db.config);
var reply=[];


try{
    connection.connect();
} catch(e){
    console.log("db connection error:"+e);
}

app.post('/callback', (reqFromLINE, res) => {
    if(line.config.validate_signature(reqFromLINE.headers['X-Line-Signature'],reqFromLINE.body)){
      console.log('X-Line-Signature validation error');
      return;
    }

    var received=reqFromLINE.body.events[0].message.text;
    var sender_lineid=reqFromLINE.body.events[0].source.userId;

    if(received.substring(0,2)=='s '){
      console.log("do search");
      var data=[received.substring(2)+'%'];
      try{
          connection.query('select * from log where message like ?', data, (error,results,fields) => {
            //console.log(error); 
            //console.log(results);
            var message="matched ";
            results.forEach( (value)=>{ message += value.userid + " " + value.message +"\n" });
            reply=[{'type':"text", 'text':message}];


            var reqToLINE = {
                url: 'https://api.line.me/v2/bot/message/reply',
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': 'Bearer ' + line.config.channelAccessToken
                },
                json:{
                  replyToken: reqFromLINE.body.events[0].replyToken,
                  messages: reply 
                }
            };
            //console.log(reqToLINE);
            request(reqToLINE, (error, response, body)=>{
                //    console.log(response);
            });
          });
      } catch (e){
          console.log(e);
      }

    } else {
	
      reply=[{'type':"text",'text':received}];

      data={'id':null, 'timestamp':new Date(), 'userid':sender_lineid, 'message':received}; // to store in the table
      try{
          connection.query('insert into log set ?',data,  (error,results,fields) => {
            if(error){
                console.log(error);
            }

            var reqToLINE = {
                url: 'https://api.line.me/v2/bot/message/reply',
                method: 'POST',
                headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Bearer ' + line.config.channelAccessToken
                },
                json:{
              replyToken: reqFromLINE.body.events[0].replyToken,
              messages: reply 
                }
            };
            //console.log(reqToLINE);
            request(reqToLINE, (error, response, body)=>{
                //    console.log(response);
            });
          });
      }catch (e){
          console.log(e);
      }
    }
    

});

app.engine('ejs',ejs.renderFile);

app.get('/listlog', (req,res)=>{
    try{
	// show all including messages from other users
	connection.query('SELECT * from log', (error,results,fields)=>{
	    if(error==null){
		var data={content:results};
		res.render('listlog.ejs',data); // なぜか views 内の listlog.ejs が読まれる
	    }
	});
    } catch (e){
	console.log(e);
    }
});

// listen on port
const port = 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});