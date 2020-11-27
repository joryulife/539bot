var request = require('request');
const lineinfo = require('./lineinfo.js');

exports.send = function(req, messages) {
  var headers = {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + lineinfo.config.channelAccessToken,
  };

  // 送信データ作成
  var data = {
    'replyToken': req.body.events[0].replyToken,
    'messages': [messages]
  };

  //オプションを定義
  var options = {
    url: 'https://api.line.me/v2/bot/message/reply',
    headers: headers,
    json: data,
  };

  request.post(options, function(error, response, body) {
    if (!error && response.statusCode == 200) {
      console.log('リクエスト成功');
    } else {
      console.log('sendエラー: ' + JSON.stringify(response));
    }
  });
}
