// cheerio
const request = require('request');
const cheerio = require('cheerio');

const keyword='更新リスト';
const reqToMember=
    {
        url:'https://Scraping-joryulife.codeanyapp.com',
        method: 'GET'
    };
  request(reqToMember, (error, response, body) => {
    if (error) {   
        console.error(error);
    }
    try {
        //console.log(response);
        const $ = cheerio.load(body,{decodeEntities: false});    //bodyの読み込み
        elem3 = $('#update').parent();
        $('li',elem3).each((i, elem) => {   //'name'クラスの要素に対して処理実行(このHTMLではp要素で, 中にはメンバー名が書かれている)
          content = $(elem).html();
          console.log(content);
        })
    } catch (e){
      console.log(e);
    }
});