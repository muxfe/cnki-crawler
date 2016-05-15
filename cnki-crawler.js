var fs = require('fs');

// webdriver
var webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  until = webdriver.until,
  error = webdriver.error,
  chrome = require('selenium-webdriver/chrome');

var Logger = require('./logger');

// const var
const COOKIE = 'cookies-5730.pkl';
const INDEX = 'http://www.5730.net';
const CNKI = '/listinfo-10-0.html';
const CNKI_CCND = 'http://epub.cnki.net/kns/brief/result.aspx?dbprefix=CCND';
const ENTER = {
  '1': '/showinfo-10-3-0.html',
  '6': '/showinfo-10-15-0.html',
  '8': '/showinfo-10-47-0.html',
  '34': '/showinfo-10-110-0.html',
  '37': '/showinfo-10-115-0.html',
  '46': '/showinfo-10-145-0.html'
};
const PATH_SEP = process.platform === 'win32' ? '\\' : '/';
const CHROME_PREFS = {
  "download.default_directory": process.cwd() + PATH_SEP + "downloads"
};

var CnkiCrawler = function (options) {
  // chrome option
  var chromeOption = new chrome.Options();
  chromeOption.setUserPreferences(CHROME_PREFS);

  // chrome driver
  var _driver = new webdriver.Builder()
      .forBrowser('chrome')
      .setAlertBehavior('accept')
      .setChromeOptions(chromeOption)
      .build();



  var _config = {
    enter: '37',
    username: 'sselaby',
    password: 'SSELab@2016',
    source: '上海证券报',
    date_from: '2012-01-01',
    date_to: '2012-01-01',
    sleeptime: 20 // seconds
  };

  // conbine configuration
  if (options && typeof options === 'object') {
    for (var key in options) {
      _config[key] = options[key];
    }
  }

  var _logger = new Logger(_config['date_from']);

  var loadCookies = function(callback) {
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
  };

  var saveCookies = function(callback) {
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
  };

  var login = function(callback) {
    if (isExist(COOKIE)) {
      console.log('try to login with cookie...');
      loadCookies(callback);
    } else {
      console.log('please login by yourself in 30 seconds.');
      _driver.wait(until.elementLocated(By.css('div.login > font')), 30 * 1000, 'you are not logged...\nquit.');
      saveCookies(callback);
    }
  };

  var getResults = function () {
    console.log('get result...');
    _driver.wait(until.elementLocated(By.id('iframeResult')), 60 * 1000, 'load result timeout.\nquit.');
    _driver.switchTo().frame('iframeResult').then(function () {
      console.log('result iframe loaded.');
      _driver.wait(until.elementLocated(By.css('#id_grid_display_num a:last-child')), 30 * 1000, 'wait 50 per page timeout.\nquit.');
      try {
        _driver.findElement(By.css('#id_grid_display_num a:last-child')).click();
        _driver.findElements(By.css('a.fz14')).then(function (data) {
          if (!data || data.length === 0) { // no result
            console.log(_config['date_from'] + ' has no result.');
            return;
          }

          // handle result
          download(data, 0);
        });
      } catch (e) {
        console.log(e);
      }
    });
  };

  var search = function() {
    console.log('search...');
    _driver.wait(until.elementLocated(By.id('CCND')), 30 * 1000, 'wait CCND timeout.\nquit.');
    _driver.findElement(By.id('CCND')).findElement(By.css('a')).click();
    _driver.findElement(By.id('advacneId')).click();
    try {
      console.log('select data source...');
      _driver.findElement(By.id('txt_1_sel')).findElement(By.css('option[value="LY"]')).click();
      _driver.findElement(By.id('txt_1_value1')).sendKeys(_config['source']);
      console.log('select search scope...');
      _driver.findElement(By.id('publishdate_from')).sendKeys(_config['date_from']);
      _driver.findElement(By.id('publishdate_to')).sendKeys(_config['date_from']);
      console.log('ready to download ' + _config['date_from'] + ' ...');
      _driver.findElement(By.id('btnSearch')).click();

      getResults();
    } catch (e) {
      console.log(e);
    }
  };

  var init = function () {
    _driver.get(INDEX);
    login(function () {
      _driver.findElement(By.partialLinkText('知网数据库')).click();

      switchWindow('知网数据库_5730');
      _driver.executeScript('window.scrollTo(0, document.body.scrollHeight);').then(function () {
        _driver.findElement(By.css('a[href="' + ENTER[_config['enter']] + '"]')).click();
        console.log('goto enter ' + _config['enter']);
        switchWindow('中国重要报纸全文数据库');
        search();
      });
    });
  };

  function download(data, index) {
    setTimeout(function () {
      if (index === data.length) {
        console.log(_config['date_from'] + ' all downloaded.\nnext day...');
      } else {
        data[index].getAttribute('text').then(function (text) {
          console.log('start download <' + text + '> ...');
          data[index].click();
          switchWindow(text);
          _driver.wait(until.elementLocated(By.partialLinkText('PDF下载'), 30 * 1000, 'wait pdf download timeout.\nquit.'));
          _driver.findElement(By.partialLinkText('PDF下载')).click();
          // download(data, index + 1);
          // 检测是否成功下载
          setTimeout(function () {
            _driver.executeScript('window.open("chrome://downloads")').then(function () {
              switchWindow('about:blank');
              _driver.get('chrome://downloads/');
              _driver.wait(until.elementLocated(By.id('downloads-display')), 10 * 1000, 'wait downloads timeout.\nquit.');
              try {
                _driver.findElement(By.css('a[tabindex="0"]')).getAttribute('text').then(function (downloadtext) {
                  if (downloadtext.indexOf(format(text)) > -1) { // success
                    console.log('<' + text + '> download success.');
                    _logger.put('items', {title: text});
                    _logger.inc('downloaded');
                    download(data, index + 1);
                  } else { //failed
                    console.log('<' + text + '> download failed.');
                    download(data, index + 1);
                  }

                  _driver.close();
                  switchWindow(text);
                  _driver.close();
                  switchWindow('中国重要报纸全文数据库');
                });
              } catch (e) {

              }
            });
          }, 10 * 1000);
        });
      }
    }, _config['sleeptime']);
  }

  return {
    init: init
  };

  function switchWindow(text) {
    var find = false;
    _driver.getAllWindowHandles().then(function (handles) {
      for (var hkey in handles) {
        _driver.switchTo().window(handles[hkey]).then(function () {
          if (!find) {
            _driver.getTitle().then(function (title) {
              if (title.indexOf(text) > -1) {
                find = true;
              }
            });
          }
        });
      }
    });
  }

  function format(text) {
    text = text.replace(/["'“”《》:：，。,;；@!~`%$￥（）*+=|、.]/g, '_');
    text = text.replace(/[\s]/g, '');
  }
};

function isExist(path) {
  try {
    var stats = fs.statSync(path);
    return true;
  } catch (e) {
    return false;
  }
};

module.exports = CnkiCrawler;
