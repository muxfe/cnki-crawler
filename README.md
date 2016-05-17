# cnki-crawler
a nodejs program crawling cnki.net build on selenium-webdriver

## Install

### Node.js

[download](https://nodejs.org/), (Version>=4.4)

### chromedriver.exe

[download](http://chromedriver.storage.googleapis.com/index.html), (Version>=2.1)

## Usage

download `zip` or `git clone` this repo.

```
cd [repo]
npm install
```

change `config.json`

```
{
  "enter": "37",
  "username": "yourname",
  // cookie文件会按username来存储，可以用不同帐号运行程序，切换时改配置文件里的username即可，不用重新登录
  // 如果在程序中登录成功并存储了cookie文件，在别的浏览器重新登录的话，这里的cookie会失效。
  "source": "上海证券报",
  "date": "2012-01-01",
  "dateend": "2012-12-31",
  "sleeptime": 20
}
```

run `node index.js`

## Note

1. on Linux, copy `chromedriver` to `/usr/bin`, on Windows, copy `chromedriver.exe` to repo dir.
1. 程序按天下载，下载路径为 `[repo]/downloads/[year]/[month]/[day]`
1. 每天的下载目录下会有一个 json 文件，记录下载情况，可能会漏下和重下，但是可以通过这个日志文件补漏(起至日期设为这一天，重新运行程序即可)
1. 程序每下载完一天后会重启，并切换一次入口，暂时只支持切换 37 和 46 入口
1. 全程无需手工干预，起至日期填写一年即可，程序如遇致命错误关闭，重新运行即可(`node index.js`)
1. 程序的重启次数和运行过程中的休眠时间成正比，即重启次数越多，休眠时间越长
1. 如果某天下载失败数超过 3，会重新下载该天失败的链接

## Error Handling

* 出现 alert，响应头/请求头，验证码等错误浏览器会自动重启，按照日志下载未下载的文档
