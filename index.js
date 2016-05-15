var fs = require('fs');
var CnkiCrawler = require('./cnki-crawler');

var config = {
  date_from: '2012-01-01',
  date_to: '2012-12-31'
}

var options = {
  date: '2012-01-04',
  enter: '37'
};

var crawler = new CnkiCrawler(options);
crawler.init();
