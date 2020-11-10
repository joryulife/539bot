var request = require('request');

const lineconfig = {
  channelAccessToken: 'dvLM1fbPEISIwrO5AMIga2wktVeR1PHVG/BhETbrKYl6uNp3swME7x8oPnbHJGnQcsGNHev6mKF4SOI52Blj8spZjBkJUN9Q2qTVKiKXfnA67jWJb5LEwONSgHCZ/UQXzljh+CrkrMVyd7zMzjLJXgdB04t89/1O/w1cDnyilFU=',
  channelSecret: 'c63cda167f5859ceda5cde822a5a7b5f'
};

var options = {
  url: 'https://api.line.me/v2/bot/message/broadcast',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': "Bearer "+lineconfig.channelAccessToken
  },
  json:{
    messages: [] 
    //,
    // notificationDisabled: true
  }
};

options.json.messages=[{type:'text',text:'hello'},{type:'text',text:'world'}];

console.log(options);

request(options, function(error, response, body){
  console.log(error);
  console.log(response);
  console.log(body);
});