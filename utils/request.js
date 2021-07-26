// 发生ajax请求

/**
 * 1. 封装功能函数
 *    1.1. 功能点明确
 *    1.2. 函数内部应该保留固定代码
 *    1.3. 将动态的函数抽取成参数，由使用者根基自身的情况动态的传入实参
 *    1.4. 一个良好的功能函数应该设置形参的默认值(ES6的形参默认值)
 * 
 * 2. 封装功能组件
 *    2.1. 功能点明确
 *    2.2. 组件内部保留静态的代码
 *    2.3. 将动态的数据抽取成props参数，由使用者根据自身的情况以标签属性的形式动态传入props数据
 *    2.4. 一个良好的组件应该设置组件的必要性及数据类型
 *        props: {
 *          msg: {
 *            required: true,
 *            default: 默认值,
 *            type: String
 *          }       
 *        }
 */

import config from './config'

export default (url, data={}, method='GET') => {
  // new Promise 初始化 promise 实例的状态为pending
  return new Promise ((resolve, reject) => {
    wx.request({
      url: config.host + url, // 真机调试 moblieHost
      data,
      method,
      header: {
        cookie: wx.getStorageSync('cookies')?wx.getStorageSync('cookies').find(item => item.indexOf('MUSIC_U') !== -1):''
      },
      success: (res) => {
        if(data.isLogin){ // 登录请求
          // 将用户的cookies存储到本地
        console.log(res.cookies);

          wx.setStorage({
            key: 'cookies',
            data: res.cookies
          })
        }
        resolve(res.data) // resolve修改promise的状态为成功状态 resolved
      },
      fail: (err) => {
        reject(err) // reject修改promise的状态为失败状态 rejected
      }
    })
  })
  
}