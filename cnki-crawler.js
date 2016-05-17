var fs = require('fs');

// webdriver
var webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  until = webdriver.until,
  error = webdriver.error,
  Key = webdriver.Key,
  promise = webdriver.promise,
  chrome = require('selenium-webdriver/chrome'),
  proxy = require('selenium-webdriver/proxy');

var Logger = require('./logger');
var Util = require('./util');

// 5730 index page for login
const INDEX = 'http://www.5730.net';
// download enterance
const ENTER = {
  '1': '/showinfo-10-3-0.html',
  '6': '/showinfo-10-15-0.html',
  '8': '/showinfo-10-47-0.html',
  '34': '/showinfo-10-110-0.html',
  '37': '/showinfo-10-115-0.html',
  '46': 'http://www.5730.net/showinfo-10-145-0.html'
};
// configuration
const CONFIG = './config.json';


var CnkiCrawler = function () {
  // configuration
  var _config = {
    enter: '46',
    username: 'sselaby',
    source: '上海证券报',
    date: '2012-01-04',
    dateend: '2012-12-31',
    sleeptime: 20 // seconds
  };

  // read config
  var config = Util.load(CONFIG);
  if (config) {
    _config = config;
  } else {
    Util.save(CONFIG, _config);
  }

  // cookie file
  var COOKIE = 'cookies-' + _config['username'] + '.pkl';

  // logger
  var _logger = new Logger(_config['date']);

  // retry times
  var restartTimes = 0;
  var WAIT = 30;
  var page = 1;
  var failedTimes = 0;

  // chrome option
  var chromeOption = new chrome.Options();
  chromeOption.setUserPreferences({
    "download.default_directory": _logger.path.day
  });
  // chromeOption.addArguments('--proxy-server=http://115.28.206.230:3128');
  // chromeOption.setProxy(proxy.manual({http: '115.28.206.230:3128'}));

  // chrome driver
  var _driver = new webdriver.Builder()
      .forBrowser('chrome')
      .setAlertBehavior('accept')
      .setChromeOptions(chromeOption)
      .build();

  _driver.manage().timeouts().pageLoadTimeout(WAIT * 1000);
  _driver.manage().timeouts().implicitlyWait(WAIT * 1000);

  return {
    start: start
  };

  // goto result iframe
  function gotoResultFrame() {
    _driver.executeScript('window.scrollTo(0, 10);').then(function () { // fix up WebElment not clickable
      return _driver.wait(until.elementLocated(By.id('iframeResult')), WAIT * 1000, 'load result timeout.\nquit.');
    }).then(function () {
      return _driver.switchTo().frame('iframeResult');
    }).then(function () {
      console.log('result iframe loaded.');
      return _driver.wait(until.elementLocated(By.css('#id_grid_display_num a:last-child')), WAIT * 1000, 'wait 50 per page timeout.\nquit.');
    }).then(function () {
      // sort
      return _driver.findElement(By.partialLinkText('报纸日期')).click();
    }).then(function () {
      return _driver.findElement(By.partialLinkText('报纸日期')).click();
    }).then(function () {
      // click 50 per page
      return _driver.findElement(By.css('#id_grid_display_num')).findElement(By.partialLinkText('50')).click();
    }).then(function () {
      getResults();
    }, function (e) {
      console.log(e.message);

    });
  };

  // get paper dataset
  function getResults() {
    // find all paper elements
    _driver.findElements(By.css('a.fz14')).then(function (data) {
      if (!data || data.length === 0) { // no result
        console.log('==========Empty ' + _config['date'] + ' ==========');
        nextDay();
        return;
      }
      console.log('==========Page: ' + page + '==========Total: ' + data.length + '==========');
      // handle result
      download(data, 0);
    }, function (e) {
      console.log(e);
    });
  }

  // search
  function search() {
    _driver.findElement(By.id('txt_1_sel')).findElement(By.css('option[value="LY"]')).click().then(function () {
      console.log('set data source...');
      return _driver.findElement(By.id('txt_1_value1')).sendKeys(_config['source']);
    }).then(function () {
      console.log('set search date_from...');
      return _driver.findElement(By.id('publishdate_from')).sendKeys(_config['date']);
    }).then(function () {
      console.log('set search date_to...');
      return _driver.findElement(By.id('publishdate_to')).sendKeys(_config['date']);
    }).then(function () {
      return _driver.sleep(1 * 1000);
    }).then(function () {
      console.log('click search')
      return _driver.findElement(By.id('btnSearch')).click();
    }).then(function () {
      gotoResultFrame();
    });
  };

  function restart() {
    _driver.quit().then(function () {
      _logger = new Logger(_config['date']);
      chromeOption = new chrome.Options();
      chromeOption.setUserPreferences({
        "download.default_directory": _logger.path.day
      });

      restartTimes++;
      WAIT += 1 * restartTimes;
      page = 1;
      failedTimes = 0;

      // chrome driver
      _driver = new webdriver.Builder()
          .forBrowser('chrome')
          .setAlertBehavior('accept')
          .setChromeOptions(chromeOption)
          .build();

      _config = Util.load(CONFIG);
      return _driver.manage().timeouts().pageLoadTimeout(WAIT * 1000);
    }).then(function () {
      return _driver.manage().timeouts().implicitlyWait(WAIT * 1000);
    }).then(function () {
      var sleep = restartTimes * 10;
      console.log('>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<');
      console.log('>>>>>>>>>>restart after sleep ' + sleep + 's.<<<<<<<<<<');
      console.log('>>>>>>>>>>>>>>>>>>>>>><<<<<<<<<<<<<<<<<<<<<<');
      return _driver.sleep(sleep * 1000);
    }).then(function () {
      start();
    });
  }

  // start
  function start() {
    if (isEnd()) {
      console.log(_config['date'] + ' ~ ' + _config['dateend'] + ' is already downloaded.');
    }
    console.log('==========Start downloading ' + _config['date'] + '==========');
    _driver.get(INDEX).then(function () {
      login();
    }).then(function () {
      return _driver.findElement(By.partialLinkText('知网数据库')).click();
    }).then(function () {
      return switchRight();
    }).then(function () {
      return _driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
    }).then(function () {
        return _driver.findElement(By.css('a[href="' + ENTER[_config['enter']] + '"]')).click();
    }).then(function () {
      return acceptAlert();
    }).then(function () {
      if (_config['enter'] === '46') {
        return _driver.wait(until.elementLocated(By.partialLinkText('知识发现网络')), WAIT * 1000, 'wait KDN timeout.\nquit.').then(function () {
          return _driver.findElement(By.partialLinkText('知识发现网络')).click();
        }, function (e) { // wait error
          promise.rejected(e);
        });
      }
    }).then(function () {
      console.log('goto enter ' + _config['enter']);
      return switchRight();
    }).then(function () {
      return _driver.wait(until.elementLocated(By.id('CCND')), WAIT * 1000, 'wait CCND timeout.\nquit.');
    }).then(function () {
      return _driver.findElement(By.id('CCND')).findElement(By.css('a')).click();
    }, function (e) {// wait error
      promise.rejected(e);
    }).then(function () {
      return _driver.findElement(By.id('advacneId')).click();
    }).then(function () {
      search();
    }).catch(function (e) {
      console.log(e);
      restart();
    });
  }

  // next page
  function nextPage() {
    console.log('====================next page====================');
    switchRight().then(function () {
      return _driver.switchTo().frame('iframeResult');
    }).then(function () {
      return _driver.findElement(By.partialLinkText('下一页')).click();
    }).then(function () {
      return _driver.sleep(_config['sleeptime'] * 1000);
    }, function (e) {
      console.log('next page error.');
      promise.rejected(e);
    }).then(function () {
      page++;
      getResults();
    }).catch(function (e) {
      if (_logger['n_failure'] > 3) {
        console.log('>>>failure too many, redownloading this day<<<');
        restart();
      } else {
        console.log('====================next day====================')
        nextDay();
      }
    });
  }

  // next day
  function nextDay() {
    _config['date'] = Util.incDate(_config['date']);
    if (_config['enter'] === '46') { // 每下一天切换一次入口
      _config['enter'] = '37';
    } else {
      _config['enter'] = '46';
    }
    restartTimes = 0;
    WAIT = 30;
    if (isEnd()) {
      console.log('------------------------------------------');
      console.log('----------------ALL DOWN------------------');
      console.log('------------------------------------------');
      _driver.quit();
      return;
    } else {
      console.log(_config);
      Util.save(CONFIG, _config);
      restart();
    }
  }

  function isEnd() {
    return new Date(_config['date']).valueOf() > new Date(_config['dateend']);
  }

  // donwload one paper
  function download(data, index) {
    var text = '';
    var href = '';
    if (index === data.length) {
      nextPage();
    } else {
      var indexOfPaper = (index + 1) + (page - 1) * 50;
      switchRight().then(function () {
        return _driver.switchTo().frame('iframeResult');
      }).then(function () {
        return data[index].getAttribute('text');
      }).then(function (t) {
        text = t;
        return data[index].getAttribute('href');
      }).then(function (h) {
        href = h;
        if (_logger.isExist(text)) {
          console.log('skip [' + indexOfPaper + ']<' + text + '> ...');
          download(data, index + 1);
          return;
        }
        console.log('------------------------------------------------------------------------');
        console.log('start download [' + indexOfPaper + ']<' + text + '> ...');
        return data[index].click();
      }).then(function () {
        return _driver.sleep(1 * 1000);
      }).then(function () {
        return switchRight();
      }).then(function () {
        return _driver.wait(until.elementLocated(By.partialLinkText('PDF下载'), WAIT * 1000, 'wait pdf download timeout.\nquit.'));
      }).then(function () {
        console.log('downloading...');
        return _driver.findElement(By.partialLinkText('PDF下载')).click();
      }, function (e) {// wait error
        console.log('!!!checkcode!!!');
        promise.rejected(Error('checkcode'));
      }).then(function () {
        return _driver.sleep(_config['sleeptime'] * 1000);
      }, function (e) {
        promise.rejected(e);
      }).then(function () {
        return _driver.getAllWindowHandles();
      }).then(function (handles) {
        if (handles.length > 4) {
          console.log('try to close alert...');
          return acceptAlert(); // handle alert('用户并发数已满')
        }
      }).then(function () {
        return _driver.sleep(1 * 1000);
      }).then(function () {
        // detect if not download success
        var exist = Util.existFile(text, _logger.path.day);
        var log = {url: href, index: indexOfPaper};
        if (exist) { // success
          console.log('<' + exist + '> download success.');
          log.filename = exist;
        } else { // failed
          failedTimes++;
          console.log('failed times: ' + failedTimes);
          if (failedTimes > 10) {
            console.log('failed too many times, restart later...');
            restart();
          }
          console.log('<' + text + '> download failed.');
        }
        _logger.put(text, log);
      }).then(function () {
        return _driver.sleep(1 * 1000);
      }).then(function () {
        return _driver.getAllWindowHandles();
      }).then(function (handles) {
        if (handles.length > 4) { // handle 500.etc. error or checkcode
          return _driver.close(); // close error page
        }
      }).then(function () {
        return switchRight();
      }).then(function () {
        return _driver.close(); // close pdf download page
      }).then(function () {
        download(data, index + 1);
      }).catch(function (e) {
        if (e.message === 'checkcode') {
          _driver.close();
          download(data, index);
        } else {
          console.log(e);
          restart();
        }
      });
    }
  }

  // switch to right window
  function switchRight() {
    return _driver.getAllWindowHandles().then(function (handles) {
      return _driver.switchTo().window(handles[handles.length - 1]);
    });
  }

  // ignore alert
  function acceptAlert() {
    return switchRight().then(function() {
      return _driver.wait(until.alertIsPresent(), 1 * 1000, 'wait alert timeout.');
    }).then(function () {
      console.log('ignore open alert.');
      return _driver.switchTo().alert().dismiss();
    }, function (e) {
      promise.rejected(e);
    }).thenCatch(function (e) {
      if (!(e instanceof error.NoSuchAlertError)) {
        console.log(e);
      } else {
        console.log('no alert open');
      }
    }).catch(function (e) {
      console.log('wait timeout');
    });
  }

  // emulate login
  function loadCookies() {
    var cookies = JSON.parse(fs.readFileSync(COOKIE));
    // console.log(cookies);
    var cookies_len = cookies.length;
    cookies.forEach(function (cookie) {
      _driver.manage().addCookie(cookie.name, cookie.value, cookie.path, cookie.domain, cookie.secure, cookie.expiry).then(function () {
        cookies_len--;
        if (cookies_len === 0) {
          _driver.navigate().refresh().then(function () {
            console.log('load ' + COOKIE + ' success');
          });
        }
      });
    });
  }

  // save cookies to local disk
  function saveCookies() {
    // save cookies
    _driver.manage().getCookies().then(function (cookies) {
      // console.log(cookies);
      fs.writeFile(COOKIE, JSON.stringify(cookies, null, 2), (err) => {
        if (err) {
          console.log('save ' + COOKIE + ' failed.');
        } else {
          console.log('save ' + COOKIE + ' successed.');
        }
      });
    });
  }

  // login www.5730.net
  function login() {
    if (Util.isExist(COOKIE)) {
      console.log('try to login with cookie...');
      loadCookies();
    } else {
      console.log('cookie not exist.\nplease login by hands in 30 seconds...');
      // dirver will quit if not login in 30 seconds
      _driver.wait(until.elementLocated(By.css('div.login > font')), 30 * 1000, 'you are not logged...\nquit.');
      // login success
      console.log('login success.');
      saveCookies();
    }
  }
};

module.exports = CnkiCrawler;
