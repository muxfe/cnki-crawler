var fs = require('fs');
var iconv = require('iconv-lite');

var Util = function () {

};

Util.prototype.isExist = isExist;

Util.prototype.isDate = function (date) {
  return /^([0-9]{4})[-/\.]([0-1]?[0-9])[-/\.]([0-3]?[0-9])$/.test(date);
};

Util.prototype.format2 = format2;

var PATH_SEP = process.platform === 'win32' ? '\\' : '/';

// path seperator
Util.prototype.PATH_SEP = PATH_SEP;

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
    var filename = ls[i].replace(/[\s][\(][0-9]+[\)]/g, '');
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
    if (filename.length < 38 && filename.indexOf(text) > -1) {
      return filename;
    } else if (filename.length >= 38 && filename.substring(0, 16).replace('_', '').indexOf(text.substring(0, 10)) > -1) {
      // long filename will not match text, so cut pre 16 string to match
      return filename;
    }
  }
  return null;
};

Util.prototype.save = function (filename, json) {
  fs.writeFile(filename, JSON.stringify(json, null, 2), (err) => {
    if (err) {
      console.log('save ' + filename + ' failed.');
    }
  });
};

Util.prototype.load = function (filename) {
  if (isExist(filename)) {
    return JSON.parse(fs.readFileSync(filename));
  } else {
    return null;
  }
};

Util.prototype.incDate = function (date) {
  var pre = new Date(date);
  var next = new Date(pre.valueOf() + 24 * 3600 * 1000);
  console.log(next);
  return (next.getFullYear() + '-' + format2(next.getMonth() + 1) + '-' + (format2(next.getDate()))); // month start with 0
};

function formatFilename(text) {
  if (typeof text === 'string') {
    text = text.replace(/[\s]/g, '');
    text = text.replace(/["'“”《》:：，。,;；@!！~`%\^…$￥（）\[\]{}“”*+=|、.()·？?]/g, '_');
    text = text.replace(/[_]{2,}/, '_');
    return text;
  }
}

function isExist(path) {
  try {
    var stats = fs.statSync(path);
    return true;
  } catch (e) {
    return false;
  }
}

function format2(n) {
  return n.toString().length < 2 ? ('0' + n) : n;
}

var util = new Util();

module.exports = util;
