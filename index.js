var fs = require('fs');
var CnkiCrawler = require('./cnki-crawler');

var options = {
  date_from: '2012-01-04',
  date_to: '2012-01-31'
};

var crawler = new CnkiCrawler(options);
crawler.init();
