// cheerio
const request = require('request');
const cheerio = require('cheerio');

const keyword='更新リスト';
const reqToMember=
    {
        url:'https://539bot-joryulife.codeanyapp.com/',
        method: 'GET'
    };
  request(reqToMember, (error, response, body) => {
    if (error) {   
        console.error(error);
    }
    try {
        const $ = cheerio.load(body,{decodeEntities: false});    //bodyの読み込み
        $('#li').each((i, elem) => {   //'name'クラスの要素に対して処理実行(このHTMLではp要素で, 中にはメンバー名が書かれている)
          console.log($(elme).html());
        })
    } catch (e){
      console.log(e);
    }
});