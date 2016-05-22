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
  var isLong = false;
  for (var i = 0; i < ls.length; i++) {
    var filename = ls[i].replace(/[\s][\(][0-9]+[\)]/g, '');
    if (process.platform === 'linux') { // linux默认 utf-8 编码，中文文件名会乱码
      var buf = new Buffer(filename, 'utf8');
      buf = iconv.encode(buf, 'iso-8859-1');
      buf = iconv.decode(buf, 'gbk');
      buf = new Buffer(buf, 'utf-8');
      filename = buf.toString();
      // console.log('text: ' + text);
      // console.log('before: ' + ls[i]);
      // console.log('after: ' + filename);
    }
    if (filename.indexOf('_省略_') > -1) {
      isLong = true;
    }
    var _fname = filename;
    filename = filename.replace(/[_]/g, '');
    if (!isLong && filename.indexOf(text) > -1) {
      return _fname;
    } else if (isLong && filename.substring(0, 12).indexOf(text.substring(0, 10)) > -1) {
      // long filename will not match text, so cut pre 12 string to match
      return _fname;
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
  // console.log(next);
  return (next.getFullYear() + '-' + format2(next.getMonth() + 1) + '-' + (format2(next.getDate()))); // month start with 0
};

function formatFilename(text) {
  if (typeof text === 'string') {
    text = text.replace(/[^\u4e00-\u9fa5\w]/g, ''); // 非中文，英文或数字，_
    text = text.replace(/[_]/g, '');
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
