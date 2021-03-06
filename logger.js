var fs = require('fs');
var Util = require('./util');

var Logger = function (date, source) {
  var _path = {
    year: '',
    month: '',
    day: '',
    log: ''
  };

  // log
  var _log = {
    date: date,
    total: 0,
    n_failure: 0,
    items: {},
    n_success: 0
  };

  var LOGS = process.cwd() + Util.PATH_SEP + 'downloads';

  // console.log(LOGS);

  if (!Util.isExist(LOGS)) {
    fs.mkdirSync(LOGS);
  }

  // source
  LOGS = LOGS + Util.PATH_SEP + source;

  if (!Util.isExist(LOGS)) {
    fs.mkdirSync(LOGS);
  }

  if (!Util.isDate(date)) {
    throw Error('date format error!');
  }

  var datepart = date.split(/[-._/]/);
  _path.year = LOGS + Util.PATH_SEP + datepart[0];
  _path.month = _path.year + Util.PATH_SEP + Util.format2(datepart[1]);
  _path.day = _path.month + Util.PATH_SEP + Util.format2(datepart[2]);
  _path.log = _path.day + Util.PATH_SEP + Util.format2(datepart[2]) + '.json';

  // create year folder
  if (!Util.isExist(_path.year)) {
    fs.mkdirSync(_path.year);
  }
  // create month folder
  if (!Util.isExist(_path.month)) {
    fs.mkdirSync(_path.month);
  }
  // create day folder
  if (!Util.isExist(_path.day)) {
    fs.mkdirSync(_path.day);
  }
  // load log
  load();

  return {
    save: save,
    load: load,
    get: get,
    getItem: getItem,
    put: put,
    inc: inc,
    path: _path,
    isExist: isExist
  };

  function put(name, value) {
    if (!name || !value) return;
    if (!!_log['items'][name]) { // exist
      if (!!value.filename) {
        inc('n_failure', -1);
        inc('n_success');
      }
    } else { // not exist
      if (!!value.filename) {
        inc('n_success');
      } else {
        inc('n_failure');
      }
      inc('total');
    }
    _log['items'][name] = value;
    save();
  }

  function save() {
    fs.writeFile(_path.log, JSON.stringify(_log, null, 2), (err) => {
      if (err) {
        console.log('save ' + _log.date + ' log failed.');
        save();
      }
    });
  }

  function load() {
    if (Util.isExist(_path.log)) {
      _log = JSON.parse(fs.readFileSync(_path.log));
    }
  }

  function inc(name, val) {
    if (typeof _log[name] === 'number') {
      _log[name] += val || 1;
      return _log[name];
    } else {
      return null;
    }
  }

  function getItem(name) {
    return _log['items'][name];
  }

  function get(name) {
    return _log[name];
  }

  function isExist(name) {
    return !!_log.items[name] && !!_log.items[name].filename;
  }
};

module.exports = Logger;
