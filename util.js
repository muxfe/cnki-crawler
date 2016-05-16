var fs = require('fs');
var iconv = require('iconv-lite');

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
  text = formatFilename(text);
  var ls = fs.readdirSync(path);
  for (var i = 0; i < ls.length; i++) {
    var filename = ls[i];
    if (process.platform === 'linux') {
      var buf = new Buffer(filename, 'utf8');
      buf = iconv.encode(buf, 'iso-8859-1');
      buf = iconv.decode(buf, 'gbk');
      buf = new Buffer(buf, 'utf-8');
      filename = buf.toString();
      // console.log('text: ' + text);
      // console.log('before: ' + ls[i]);
      // console.log('after: ' + filename);
    }
    if (filename.indexOf(text) > -1) {
      return filename;
    }
  }
  return null;
};

Util.prototype.save = function (filename, json) {
  fs.writeFile(filename, JSON.stringify(json), (err) => {
    if (err) {
      console.log('save ' + filename + ' failed.');
    }
  });
};

Util.prototype.load = function (filename) {
  if (Util.isExist(filename)) {
    return JSON.parse(fs.readFileSync(filename));
  } else {
    return null;
  }
};

Util.prototype.incDate = function (date) {
  var pre = new Date(date);
  var next = new Date(pre.valueOf() + 24 * 3600 * 1000);
  return next.getFullYear() + '-' + Util.format2(next.getMonth() + 1) + '-' + Util.format2(next.getDay());
};

function formatFilename(text) {
  if (typeof text === 'string') {
    text = text.replace(/[\s]/g, '');
    text = text.replace(/["'“”《》:：，。,;；@!~`%$￥（）*+=|、.]/g, '_');
    return text;
  }
};

var util = new Util();

module.exports = util;
