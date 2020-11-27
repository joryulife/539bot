const crypto=require("crypto"); // needs npm install crypto

module.exports.config={
  //チャンネルID
channelId:"1655031634",
//チャンネルシークレット
channelSecret:"c63cda167f5859ceda5cde822a5a7b5f",
//アサーション署名キー
assertionSignatureKey1:"68d1eade-9789-48c1-a309-60586ce23ace",
assertionSignatureKey2:"b10d3fc6-feed-42f2-9182-88dd328b32ea",
//ユーザーID
userId:"U3aa127f38f35ddee3962757fe0d50eba",
//ベーシックID
basicId:"@049kvxjn",
//チャンネルアクセストークン
channelAccessToken:"dvLM1fbPEISIwrO5AMIga2wktVeR1PHVG/BhETbrKYl6uNp3swME7x8oPnbHJGnQcsGNHev6mKF4SOI52Blj8spZjBkJUN9Q2qTVKiKXfnA67jWJb5LEwONSgHCZ/UQXzljh+CrkrMVyd7zMzjLJXgdB04t89/1O/w1cDnyilFU=",
  validate_signature: function(signature, body){
    console.log(signature == crypto.createHmac('sha256', this.channelSecret).update(Buffer.from(JSON.stringify(body))).digest('base64'));
    return signature == crypto.createHmac('sha256', this.channelSecret).update(Buffer.from(JSON.stringify(body))).digest('base64');
  }
};