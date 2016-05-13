var webdriver = require('selenium-webdriver'),
  By = webdriver.By,
  until = webdriver.until,
  error = webdriver.error;

var fs = require('fs');

const COOKIE = 'cookies.pkl';

var driver = new webdriver.Builder()
    .forBrowser('chrome')
    .build();


driver.get('http://www.5730.net');
try {
  console.log('try to login with cookie');
  var cookie_stats = fs.statSync(COOKIE);
  var cookies = JSON.parse(fs.readFileSync(COOKIE));
  // console.log(cookies);
  var cookies_len = cookies.length;
  cookies.forEach(function (cookie) {
    driver.manage().addCookie(cookie.name, cookie.value, cookie.path, cookie.domain, cookie.secure, cookie.expiry).then(function () {
      cookies_len--;
      if (cookies_len === 0) {
        driver.navigate().refresh().then(function () {
          console.log('login success');
          gotoCnki();
        });
      }
    });
  });
} catch (e) {
  console.log('please login by yourself.');
  driver.wait(until.elementLocated(By.css('div.login > font')), 30 * 1000, 'u are not logged.');

  driver.manage().getCookies().then(function (cookies) {
    // console.log(cookies);
    fs.writeFile(COOKIE, JSON.stringify(cookies), (err) => {
      if (err) {
        console.log('save cookie failed.');
      } else {
        console.log('save cookie successed.');
        gotoCnki();
      }
    });
  });
}

function gotoCnki() {
  // 入口 46
  console.log('goto enter 46');
  driver.get('http://www.5730.net/showinfo-10-145-0.html');
  try {
    // driver.findElement(By.css('a[href="http://www.5730.net/showinfo-10-145-0.html"]')).click();
    driver.switchTo().alert().dismiss();
  } catch (e) {
    if (e instanceof error.NoSuchAlertError) {
      console.log('no alert.');
    } else if (e instanceof error.NoSuchElementError) {
      console.log('no such element');
    }
  }

  driver.findElement(By.css('div#content > div:nth-child(4) > a')).click();
  driver.get('http://epub.cnki.net/kns/brief/result.aspx?dbprefix=CCND');

  try {
    driver.findElement(By.id('txt_1_sel')).sendKeys('LY');
    driver.findElement(By.id('txt_1_value1')).sendKeys('上海证券报');
    driver.findElement(By.id('publishdate_from')).sendKeys('2012-04-01');
    driver.findElement(By.id('publishdate_to')).sendKeys('2012-04-01');
    // driver.findElement(By.id('magazine_value1')).sendKeys('上海证券报');

    driver.findElement(By.id('btnSearch')).click();
  } catch (e) {
    console.log(e);
  }
}



// driver.findElement(By.name('q')).sendKeys('webdriver');
// driver.findElement(By.name('btnG')).click();
// driver.wait(until.titleIs('webdriver - Baidu Search'), 1000);

// console.log('driver quit');
// driver.quit();
