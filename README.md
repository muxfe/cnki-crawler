# cnki-crawler

一个基于 selenium-webdriver 的 nodejs 爬虫程序，用来下载知网论文。

A nodejs program crawling cnki.net build on selenium-webdriver.

## Install

### Node.js

[download](https://nodejs.org/), (Version>=4.4)

### chromedriver.exe

[download](http://chromedriver.storage.googleapis.com/index.html), (Version>=2.1)

## Usage

### Get Code

download `zip` or `git clone` this repo.

### Install Dependencies

```
cd [repo]
npm update
```

### Change Configuration

change `config.json`

```
{
  "enter": "46",
  // cookie文件会按username来存储，可以用不同帐号运行程序，切换时改配置文件里的username即可，不用重新登录
  // 如果在程序中登录成功并存储了cookie文件，在别的浏览器重新登录的话，这里的cookie会失效。
  "username": "labsse1",
  "source": "中国证券报",
  "date": "2010-01-04",
  "dateend": "2010-05-31",
  "sleeptime": 20,
  "auto_toggle_enter": true // 如果不想程序自动切换入口，改成 false
}
```

### Run

`node index.js`

### Update Code

1. backup your `config.json` to other dir.
1. `cd [repo]` then pull newest code by `git pull`.
1. copy backup `config.json` to [repo] overwrite it.

## Note

1. on Linux, copy `chromedriver` to `/usr/bin`, on Windows, copy `chromedriver.exe` to repo dir.
1. 程序按天下载，下载路径为 `[repo]/downloads/[source]/[year]/[month]/[day]`
1. 启动程序后有 30 秒时间登录，点击登录后不用再做任何操作
1. 每天的下载目录下会有一个 json 文件，记录下载情况
1. 遇到 alert 或 50x 等错误时会尝试重新下载，失败超过 **5** 次重启
1. 程序每下载完一天后会重启，并切换一次入口（可以关闭），暂时只支持切换 37 和 46 入口（可以关闭这个功能）
1. 全程无需手工干预，起至日期填写较长时间也可也，程序如遇致命错误关闭，重新运行即可(`node index.js`)
1. 程序的重启次数和运行过程中的休眠时间成正比，即重启次数越多，休眠时间越长，一天下完后重置
1. 如果某天下载失败数超过 **2**，会重新下载该天失败的链接
1. 失败多次程序会尝试切换入口（37 容易被封 IP，用 46 入口，关闭 auto_toggle_enter 选项）
1. 浏览器打开后可以手工下载，程序会判断已存在的文件，不会重复下载

## Error Handling

* 出现 alert，响应头/请求头，验证码等错误浏览器会重下或重启，按照日志下载未下载的文档
* 设置错误率控制，大于 3 个失败就重新下载当天

## Issue Tracker

* 出现 `angle_platform_impl.cc` 错误

  暂时没有修复办法，有的话请提 [PR](https://github.com/x-web/cnki-crawler/issues/new)
* 出现 `WebElment not clickable` 错误而频繁重启

  分辨率问题，导致要点击的元素被其他元素遮挡（已修复）
* `npm install` 安装时间过长，或安装失败

  重新运行命令
* Linux 下（UTF-8编码）文件名会乱码，检测下载文件时会自动转码，但是不会修改文件名，可以用 `convmv` 工具批量转码，以 Ubuntu 为例，

  ```
  sudo apt-get install convmv
  cd [repo]/downloads
  convmv -f utf8 -t iso-8859-1 -r --notest *
  convmv -f gbk -t utf8 -r --notest *
  ```

* ELISTEN 端口占用错误

  由于 selenium-webdriver 框架会通过 socket 与 chrome 通信，会在 1024-65535 随机选择端口，有可能选到被占用的，多重启几次即可

* 有时候 cookie 会失效，这时候需要重新登陆

  cookie 时效很长，会失效是因为账号在其他地方登录

## Change Log [2016-05-22]

1. 修改文件名匹配方式，不会漏掉某些特殊字符
1. 增加重新下载失败链接，达到一定次数重启浏览器
1. 修复之前下载路径的问题，加上报纸来源一级文件夹
