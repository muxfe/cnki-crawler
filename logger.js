var fs = require('fs');

const LOGS = './logs';

var Logger = function (date) {
  var _path = {
    year: '',
    month: '',
    day: ''
  };

  var _log = {
    date: date,
    total: 0,
    downloaded: 0,
    items: []
  };

  if (!isExist(LOGS)) {
    fs.mkdirSync(LOGS);
  }

  if (/^([0-9]{4})[-/\.]([0-1]?[0-9])[-/\.]([0-3]?[0-9])$/.test(date) === false) {
    throw Error('date format error!');
  }
  var datepart = date.split(/[-._]/);
  _path.year = LOGS + '/' + datepart[0];
  _path.month = _path.year + '/' + datepart[1];
  _path.day = _path.month + '/' + datepart[2] + '.json';

  if (!isExist(_path.year)) {
    fs.mkdirSync(_path.year);
  }
  if (!isExist(_path.month)) {
    fs.mkdirSync(_path.month);
  }

  var put = function (name, value) {
    if (Array.isArray(_log[name])) {
      _log[name].push(value);
    } else if (typeof name === 'string') {
      _log[name] = value;
    }
  };

  var save = function () {
    fs.writeFile(_path.day, JSON.stringify(_log), (err) => {
      if (err) {
        console.log('save ' + _log.date + ' log failed.');
      } else {
        console.log('save ' + _log.date + ' log successed.');
      }
    });
  };

  var load = function () {
    if (isExist(_path.day)) {
      return JSON.parse(fs.readFileSync(_path.day));
    } else {
      console.log(_path.day + ' not exist.');
      return null;
    }
  };

  var inc = function (name, val) {
    _log[name] += val || 1;
  };

  var get = function (name) {
    return _log[name];
  };

  return {
    save: save,
    load: load,
    get: get,
    put: put
  };
};

function format(n) {
  return n.length < 2 ? '0' + n : n;
};

function isExist(path) {
  try {
    var stats = fs.statSync(path);
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = Logger;
