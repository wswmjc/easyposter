const express = require('express');
const pool = require('../bin/pool')
const qiniuTool = require('../bin/utils')
const router = express.Router();
const devices = require('puppeteer/DeviceDescriptors')
const iPhone = devices['iPhone 8']
const browserPool = pool.InitPool({ // 全局只应该被初始化一次
  puppeteerArgs: {
    ignoreHTTPSErrors: true,
    headless: true, // 是否启用无头模式页面
    timeout: 0,
    pipe: true, // 不使用 websocket 
    args: ['--no-sandbox',
      '--disable-setuid-sandbox',
      '-–disable-gpu',
      '-–disable-dev-shm-usage',
      '-–no-first-run',
      '-–no-zygote',
      '-–single-process'
    ]
  }
})

const GetPoster = async (url,completeSelectorKey = '.load-complete') => {
  let screenshot = ''
  try {
    const page = await browserPool.use(async (instance) => {
      const page = await instance.newPage()
      await page.emulate(iPhone)
      await page.goto(url, {
        waitUntil: ['load', 'domcontentloaded']
      });
      // 检测页面中加载完成标致  可以自定义
      if(completeSelectorKey) {
        await page.waitForSelector(completeSelectorKey)
      }
      return page
    })
    // let path = 'example.jpg'
    screenshot = await page.screenshot({
      // path: path,
      fullPage: true,
      quality: 100,
      type: 'jpeg'
    });
    page.close()
  } catch (err) {
    console.log(err)
  }
  return screenshot
}
 
/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', {
    title: 'Express'
  });
});

router.post('/GetPoster', function (req, res, next) {
  let {
    name,
    url,
    completeSelectorKey
    // ,timestamp,sign
  } = req.body
  // 验签逻辑
  // if (auth.check({name,url,timestamp},sign) == false) {
  //   res.json({status:0, msg:'验签错误'})
  //   return
  // }
  if (!url || (url.indexOf('http://') == -1 && url.indexOf('https://'))) {
    res.json({
      status: 0,
      msg: '截图目标地址不正确，请以http://或https://开头'
    })
    return
  }
  GetPoster(url,completeSelectorKey).then(result => {
    let filename = `poster_${new Date().getTime()}${name?('_'+(name.indexOf('.')==-1?name:name.split('.')[0])):''}.jpg`
    qiniuTool.UploadImgStream({
      fileName: filename,
      file: result,
      success: (result) => {
        res.json({
          status: 1,
          data: {
            poster_path: `https://postercdn.cn/${result.key}`
          }
        })
      },
      fail: (err) => {
        res.json({
          status: 0,
          msg: 'upload err'
        })
      }
    })
  })
})

module.exports = router;