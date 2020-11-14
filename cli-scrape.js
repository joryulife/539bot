// cheerio
const request = require('request');
const cheerio = require('cheerio');
const keyword='菅井';
const furigana='.furigana';
const reqToMember=
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
        $('.name' ).each((i, elem) => {   //'name'クラスの要素に対して処理実行(このHTMLではp要素で, 中にはメンバー名が書かれている)
            if( $(elem).html().match(keyword) ){
              //console.log("in 1");
               if( $(elem).parent().find('.furigana').html() != null ){
                 //console.log("in 2");
                 //console.log($(elem).parent().find('.furigana').html());
                 furi = $(elem).parent().find('.furigana').html();
               }
            }
        })
        console.log(furi);
    } catch (e){
      console.log(e);
    }
});