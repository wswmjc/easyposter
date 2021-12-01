const superagent = require('superagent')
const auth = require('./auth')
const qiniu = require('qiniu')
const config = new qiniu.conf.Config()
config.zone = qiniu.zone.Zone_z0
const formUploader = new qiniu.form_up.FormUploader(config)
const putExtra = new qiniu.form_up.PutExtra()

const qiniuTool = {}
qiniuTool.UploadImgStream = ({
    fileName,
    file,
    success = (result) => {},
    fail = (err) => {}
}) => {
    return GetToken().then(result => {
        const token = result.data.pic
        formUploader.put(token, fileName, file, putExtra, function (err, res, resInfo) {
            if (resInfo.statusCode == 200) {
                success(res)
            } else {
                fail(err)
            }
        })
    })
}

function GetToken() {
    return superagent.get('https://tokenget.cn/qiniu/token').query(auth.auth()).then(result => {
        return result.body
    }).catch(err => {
        console.log(err)
    })
}

qiniuTool.GetToken = GetToken

module.exports = qiniuTool
