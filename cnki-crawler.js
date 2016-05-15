var fs = require('fs');

// webdriver
var webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  until = webdriver.until,
  error = webdriver.error,
  Key = webdriver.Key,
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


var CnkiCrawler = function (options) {
  // configuration
  var _config = {
    enter: '37',
    username: 'sselaby',
    password: 'SSELab@2016',
    source: '上海证券报',
    date: '2012-01-01',
    sleeptime: 20, // seconds
    page: 1
  };

  // conbine configuration
  if (options && typeof options === 'object') {
    for (var key in options) {
      _config[key] = options[key];
    }
  }

  // cookie file
  var COOKIE = 'cookies-' + _config['username'] + '.pkl';

  // logger
  var _logger = new Logger(_config['date']);

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

  return {
    start: start
  };

  function gotoResultFrame() {
    _driver.wait(until.elementLocated(By.id('iframeResult')), 60 * 1000, 'load result timeout.\nquit.').then(function () {
      return _driver.switchTo().frame('iframeResult');
    }).then(function () {
      console.log('result iframe loaded.');
      return _driver.wait(until.elementLocated(By.css('#id_grid_display_num a:last-child')), 30 * 1000, 'wait 50 per page timeout.\nquit.');
    }).then(function () {
      // sort
      return _driver.findElement(By.partialLinkText('报纸日期')).click();
    }).then(function () {
      return _driver.findElement(By.partialLinkText('报纸日期')).click();
    }).then(function () {
      // click 50 per page
      return _driver.findElement(By.css('#id_grid_display_num a:last-child')).click();
    }).then(function () {
      getResults();
    });
  };

  function getResults() {
    try {
      // find all paper elements
      _driver.findElements(By.css('a.fz14')).then(function (data) {
        if (!data || data.length === 0) { // no result
          console.log(_config['date'] + ' has no result.');
          return;
        }

        // handle result
        download(data, 0);
      });
    } catch(e) {
      console.log(e);
    }
  }

  function search() {
    try {
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
        console.log('click search')
        return _driver.findElement(By.id('btnSearch')).click();
      }).then(function () {
        gotoResultFrame();
      });
    } catch (e) {
      console.log(e);
    }
  };

  function start() {
    _driver.get(INDEX);
    login(function () {
      _driver.findElement(By.partialLinkText('知网数据库')).click().then(function () {
        switchWindow('知网数据库_5730');
        return _driver.executeScript('window.scrollTo(0, document.body.scrollHeight);');
      }).then(function () {
          return _driver.findElement(By.css('a[href="' + ENTER[_config['enter']] + '"]')).click();
      }).then(function () {
        // enter 46 different
        if (_config['enter'] === '46') {
          _driver.switchTo().alert().thenCatch(function (e) {
            if (!e instanceof error.NoSuchAlertError) {
              console.log(e);
            }
          }).then(function (alert) {
            _driver.sleep(10 * 1000).then(function () {
              switchWindow('选择平台入口');
              return _driver.wait(until.elementLocated(By.partialLinkText('知识发现网络')), 30 * 1000, 'wait KDN timeout.\nquit.');
            }).then(function () {
              return _driver.findElement(By.partialLinkText('知识发现网络')).click();
            }).then(function () {
              gotoEnter();
            });
          }, function (e) {
            console.log(e);
          });
        } else {
          gotoEnter();
        }

        function gotoEnter() {
          console.log('goto enter ' + _config['enter']);
          switchWindow('中国重要报纸全文数据库');
          _driver.wait(until.elementLocated(By.id('CCND')), 30 * 1000, 'wait CCND timeout.\nquit.').then(function () {
            return _driver.findElement(By.id('CCND')).findElement(By.css('a')).click();
          }).then(function () {
            return _driver.findElement(By.id('advacneId')).click();
          }).then(function () {
            search();
          });
        }
      });
    });
  }

  function nextPage() {
    try {
      _driver.wait(By.partialLinkText('下一页'), 10 * 1000, 'wait next page timeout.\nquit.').then(function () {
        return _driver.findElement(By.partialLinkText('下一页')).click();
      }).then(function () {
        return _driver.sleep(30 * 1000);
      }).then(function () {
          console.log('next page...');
          getResults();
      });
    } catch (e) {
      if (e instanceof error.NoSuchElement) {
        console.log('download all finished.');
        _driver.quit();
      }
    }
  }

  function download(data, index) {
    var text = '';
    var href = '';
    if (index === data.length) {
      nextPage();
    } else {
      data[index].getAttribute('text').then(function (t) {
        text = t;
        return data[index].getAttribute('href');
      }).then(function (h) {
        href = h;
        if (_logger.isExist(text)) {
          console.log('skip <' + text + '> ...');
          download(data, index + 1);
          return;
        }
        console.log('start download <' + text + '> ...');
        return data[index].click();
      }).then(function () {
        switchWindow(text);
        return _driver.wait(until.elementLocated(By.partialLinkText('PDF下载'), 60 * 1000, 'wait pdf download timeout.\nquit.'));
      }).then(function () {
        return _driver.findElement(By.partialLinkText('PDF下载')).click();
      }).then(function () {
        // 检测是否成功下载
        setTimeout(function () {
          var exist = Util.existFile(text, _logger.path.day);
          var log = {url: href};
          if (exist) { // success
            console.log('<' + exist + '> download success.');
            log.filename = exist;
            _logger.inc('n_success');
          } else { // failed
            console.log('<' + text + '> download failed.');
          }
          _logger.put(text, log);
          switchWindow(text);
          _driver.close();
          switchWindow('中国重要报纸全文数据库');
          setTimeout(function () {
            download(data, index + 1);
          }, _config['sleeptime']);
        }, 30 * 1000);
      });
    }
  }

  // driver switchs window according title contains specified text
  function switchWindow(text, callback) {
    var find = false;
    _driver.getAllWindowHandles().then(function (handles) {
      for (var hkey in handles) {
        _driver.switchTo().window(handles[hkey]).then(function () {
          if (!find) {
            _driver.getTitle().then(function (title) {
              if (title.indexOf(text) > -1) {
                find = true;
                typeof callback === 'function' && callback;
              }
            });
          }
        });
      }
    });
  }

  // emulate login
  function loadCookies(callback) {
    var cookies = JSON.parse(fs.readFileSync(COOKIE));
    // console.log(cookies);
    var cookies_len = cookies.length;
    cookies.forEach(function (cookie) {
      _driver.manage().addCookie(cookie.name, cookie.value, cookie.path, cookie.domain, cookie.secure, cookie.expiry).then(function () {
        cookies_len--;
        if (cookies_len === 0) {
          _driver.navigate().refresh().then(function () {
            console.log('load ' + COOKIE + ' success');
            typeof callback === 'function' && callback();
          });
        }
      });
    });
  }

  // save cookies to local disk
  function saveCookies(callback) {
    // save cookies
    _driver.manage().getCookies().then(function (cookies) {
      // console.log(cookies);
      fs.writeFile(COOKIE, JSON.stringify(cookies), (err) => {
        if (err) {
          console.log('save ' + COOKIE + ' failed.');
        } else {
          console.log('save ' + COOKIE + ' successed.');
          typeof callback === 'function' && callback();
        }
      });
    });
  }

  // login www.5730.net
  function login(callback) {
    if (Util.isExist(COOKIE)) {
      console.log('try to login with cookie...');
      loadCookies(callback);
    } else {
      console.log('cookie not exist.\nplease login by hands in 30 seconds...');
      // dirver will quit if not login in 30 seconds
      _driver.wait(until.elementLocated(By.css('div.login > font')), 30 * 1000, 'you are not logged...\nquit.');
      // login success
      console.log('login success.');
      saveCookies(callback);
    }
  }
};

module.exports = CnkiCrawler;
