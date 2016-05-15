var fs = require('fs');

var Util = function () {

};

Util.prototype.isExist = function (path) {
  try {
    var stats = fs.statSync(path);
    return true;
  } catch (e) {
    return false;
  }
};

Util.prototype.isDate = function (date) {
  return /^([0-9]{4})[-/\.]([0-1]?[0-9])[-/\.]([0-3]?[0-9])$/.test(date);
};

Util.prototype.format2 = function (n) {
  return n.length < 2 ? ('0' + n) : n;
};

Util.prototype.formatFilename = function (text) {
  if (typeof text === 'string') {
    text = text.replace(/[\s]/g, '');
    text = text.replace(/["'“”《》:：，。,;；@!~`%$￥（）*+=|、.]/g, '_');
    return text;
  }
};

// path seperator
Util.prototype.PATH_SEP = process.platform === 'win32' ? '\\' : '/';

Util.prototype.date2path = function (date) {
  var path = '';
  if (isDate(date)) {
      var datepart = date.split(/[-/._]/);
      for (var i = 0; i < datepart.length; i++) {
        path += format2(datepart[i]) + PATH_SEP;
      }
  }
  return path;
};

Util.prototype.existFile = function (text, path) {
  var ls = fs.readdirSync(path);
  for (var i = 0; i < ls.length; i++) {
    if (ls[i].indexOf(text) > -1) {
      return ls[i];
    }
  }
  return null;
};



var util = new Util();

module.exports = util;
