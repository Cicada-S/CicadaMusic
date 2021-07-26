// pages/video/video.js
import request from '../../utils/request'

Page({

  /**
   * 页面的初始数据
   */
  data: {
    videoGroupListData: [], // 导航标签数据
    navId: '', // 导航的标识
    videoList: [], // 视频列表数据
    videoId: '', // 视频id标识
    videoUpdataTime: [], // 记录video的播放时长
    isTriggered: false, // 标识下拉刷新是否开启
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // 获取导航数据
    this.getVideoGroupListData()
  },

  // 获取导航数据
  async getVideoGroupListData() {
    let videoGroupListData = await request('/video/group/list')
    this.setData({
      videoGroupListData: videoGroupListData.data.slice(0,14),
      // navId 的默认值
      navId: videoGroupListData.data[0].id
    })
    // 获取视频列表数据
    this.getVideoList(this.data.navId)
  },

  // 获取视频列表数据
  async getVideoList(navId) {
    let videoListData = await request('/video/group', {id: navId})
    // 关闭加载层
    wx.hideLoading()

    let index = 0;
    let videoList = videoListData.datas.map(item => {
      item.id = index++
      return item
    })
    this.setData({
      videoList,
      isTriggered: false // 结束下拉刷新
    })
  },

  // 点击切换导航的回调
  changeNav(event){
    let navId = event.currentTarget.id // 通过id想event进行传值的时候如果传的值的number会自动转换成string
    this.setData({
      navId: navId >>> 0,
      videoList: []
    })
    // 显示正在加载
    wx.showLoading({
      title: "正在加载..."
    })

    // 动态获取当前导航对应的视频数据
    this.getVideoList(this.data.navId)
  },

  // 点击播放/继续播放的回调
  handlePlay(event) {
    /**
     * 问题：多个视频可以同时播放的问题
     * 
     * 需求：
     *  1. 在点击播放的事件中需要找到上一个播放的视频
     *  2. 在播放新的视频之前关闭上一个正在播放的视频
     * 关键：
     *  1. 如何找到上一个视频的对象
     *  2. 如何确定点击播放的视频和正在播放的视频不是同一个视频
     * 单例模式：
     *  1. 需要创建多个对象的场景下，通过一个变量接收，始终保持只有一个对象
     *  2. 节省内存空间
     */
    let vid = event.currentTarget.id
    
    // 关闭上一个视频的实例
    // this.vid !== vid && this.VideoContext && this.VideoContext.stop()
    // this.vid = vid;

    /**
     * BUG:
     *   把视频切换回来视频不会自动播放
     *   视频不播放而会有声音
     *   如果点击播放就会出现两个声音
     * 真机测试:
     *  不会有上面这个bug，但是需要点击两次才可以播放视频
     */

    // 更新data中video的状态数据
    this.setData({
      videoId: vid
    })
    // 创建控制video标签的对象
    this.VideoContext = wx.createVideoContext(vid)
    // 判断当前视频之前是否播放过，是否播放记录，如果有，跳转至指定的播放位置
    let {videoUpdataTime} = this.data
    let videoItem = videoUpdataTime.find(item => item.vid === vid)
    if(videoItem) {
        this.VideoContext.seek(videoItem.currentTime)
    }
    this.VideoContext.play()
  },

  // 监听视频播放进度的回调
  handleTimeUpdata(event){
    let videoTimeObj = {vid: event.currentTarget.id, currentTime: event.detail.currentTime}
    let {videoUpdataTime} = this.data
    /**
     * 思路: 判断记录播放时长的播放videoUpdataTime数组中是否有当前视频的播放记录
     *  1. 如果有，在原有的播放记录中修改播放时间为当前播放时间
     *  2. 如果没有，需要在数组中添加当前视频的播放对象
     */
    let videoItem = videoUpdataTime.find(item => item.vid === videoTimeObj.vid)
    if(videoItem){ // 之前有
      videoItem.currentTime = event.detail.currentTime
    }else{ // 之前没有
      videoUpdataTime.push(videoTimeObj)
    }
    this.setData({
      videoUpdataTime
    })
  },

  // 视频播放结束调用的回调
  handleEnded(event) {
    let {videoUpdataTime} = this.data
    videoUpdataTime.splice(videoUpdataTime.findIndex(item => item.vid === event.currentTarget.id), 1)
    this.setData({
      videoUpdataTime
    })
  },

  // 自定义下拉刷新的回调 scroll-view
  handleRefresher() {
    console.log('scroll下拉刷新');
    // 再次发请求，获取最新的视频列表数据
    this.getVideoList(this.data.navId)
  },

  // 自定义上拉触底的回调 scroll-view
  bandleToLower() {
    console.log('scroll-view 触底了');
    // 数据分页： 1. 后端分页  2. 前端分页
    console.log('发送请求 || 在前端截取最新的数据 追加到视频的后方');
    console.log('网易云音乐暂时没有提供分页的api');
    // 模拟数据
    let newVideoList = [
      {
          "type": 1,
          "displayed": false,
          "alg": "onlineHotGroup",
          "extAlg": null,
          "data": {
              "alg": "onlineHotGroup",
              "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
              "threadId": "R_VI_62_B0205F4769C6910C79A282F17071E54C",
              "coverUrl": "https://p1.music.126.net/t00iHfSyc-PaxR0DjosLmQ==/109951163747442364.jpg",
              "height": 360,
              "width": 640,
              "title": "BLACKPINK 2018东京演唱会《REALLY》，粉墨四美可爱漂亮",
              "description": null,
              "commentCount": 357,
              "shareCount": 927,
              "resolutions": [
                  {
                      "resolution": 720,
                      "size": 63161234
                  },
                  {
                      "resolution": 480,
                      "size": 42843535
                  },
                  {
                      "resolution": 240,
                      "size": 24864768
                  }
              ],
              "creator": {
                  "defaultAvatar": false,
                  "province": 140000,
                  "authStatus": 0,
                  "followed": false,
                  "avatarUrl": "http://p1.music.126.net/9pDgFT95_2-vitEOHBo7-A==/109951163654640261.jpg",
                  "accountStatus": 0,
                  "gender": 1,
                  "city": 140100,
                  "birthday": -2209017600000,
                  "userId": 17628423,
                  "userType": 0,
                  "nickname": "Air刘",
                  "signature": "",
                  "description": "",
                  "detailDescription": "",
                  "avatarImgId": 109951163654640260,
                  "backgroundImgId": 2002210674180204,
                  "backgroundUrl": "http://p1.music.126.net/5L9yqWa_UnlHtlp7li5PAg==/2002210674180204.jpg",
                  "authority": 0,
                  "mutual": false,
                  "expertTags": null,
                  "experts": {
                      "1": "音乐视频达人"
                  },
                  "djStatus": 0,
                  "vipType": 0,
                  "remarkName": null,
                  "backgroundImgIdStr": "2002210674180204",
                  "avatarImgIdStr": "109951163654640261"
              },
              "urlInfo": {
                  "id": "B0205F4769C6910C79A282F17071E54C",
                  "url": "http://vodkgeyttp9c.vod.126.net/vodkgeyttp8/wPmKrZFS_2210237150_shd.mp4?ts=1627014553&rid=D87ED31FDFFC85FD37DCE437949E7796&rl=3&rs=uuZcMlsqkwVRhxsNzQQAlJtsMZkyoVVb&sign=1480a393a0db4aa7522bdc05dfbf7087&ext=m9oSix3BSU%2B8jK%2F8Kv5f1LZdhwhXWNX%2FTwj5rvENmt0lntRB8T8YCRbcbzsEXpyOZwmRdweoI9oXWVPw3JP1sfzA4NVm74nmlBoYKu1UswtVKCclYKlGFjWHsYGoYaR5nDJc5u1iJgCDm61krKZp7jXshk3nt%2FF0Fibl%2F2EI3NVYKVVrThcRdZvsk85NVTrvmAuL1z5%2BCCeb0irmjUwF3%2F%2FyvJbEfSy9FSHkRr%2BV17nBgcxs%2BUl%2BNhYs0YYjzDhe",
                  "size": 63161234,
                  "validityTime": 1200,
                  "needPay": false,
                  "payInfo": null,
                  "r": 720
              },
              "videoGroup": [
                  {
                      "id": 58100,
                      "name": "现场",
                      "alg": null
                  },
                  {
                      "id": 1101,
                      "name": "舞蹈",
                      "alg": null
                  },
                  {
                      "id": 9102,
                      "name": "演唱会",
                      "alg": null
                  },
                  {
                      "id": 57107,
                      "name": "韩语现场",
                      "alg": null
                  },
                  {
                      "id": 57108,
                      "name": "流行现场",
                      "alg": null
                  },
                  {
                      "id": 1100,
                      "name": "音乐现场",
                      "alg": null
                  },
                  {
                      "id": 5100,
                      "name": "音乐",
                      "alg": null
                  },
                  {
                      "id": 92105,
                      "name": "BLACKPINK",
                      "alg": null
                  },
                  {
                      "id": 23116,
                      "name": "音乐推荐",
                      "alg": null
                  }
              ],
              "previewUrl": null,
              "previewDurationms": 0,
              "hasRelatedGameAd": false,
              "markTypes": [
                  101
              ],
              "relateSong": [
                  {
                      "name": "REALLY",
                      "id": 1325896375,
                      "pst": 0,
                      "t": 0,
                      "ar": [
                          {
                              "id": 12068017,
                              "name": "BLACKPINK",
                              "tns": [],
                              "alias": []
                          }
                      ],
                      "alia": [],
                      "pop": 100,
                      "st": 0,
                      "rt": null,
                      "fee": 8,
                      "v": 6,
                      "crbt": null,
                      "cf": "",
                      "al": {
                          "id": 74266151,
                          "name": "BLACKPINK IN YOUR AREA",
                          "picUrl": "http://p4.music.126.net/yKysEblB7-HOVrUCjvRhqw==/109951163678530141.jpg",
                          "tns": [],
                          "pic_str": "109951163678530141",
                          "pic": 109951163678530140
                      },
                      "dt": 197360,
                      "h": {
                          "br": 320000,
                          "fid": 0,
                          "size": 7897382,
                          "vd": -40900
                      },
                      "m": {
                          "br": 192000,
                          "fid": 0,
                          "size": 4738447,
                          "vd": -38200
                      },
                      "l": {
                          "br": 128000,
                          "fid": 0,
                          "size": 3158979,
                          "vd": -36700
                      },
                      "a": null,
                      "cd": "1",
                      "no": 8,
                      "rtUrl": null,
                      "ftype": 0,
                      "rtUrls": [],
                      "djId": 0,
                      "copyright": 0,
                      "s_id": 0,
                      "rtype": 0,
                      "rurl": null,
                      "mst": 9,
                      "cp": 457010,
                      "mv": 0,
                      "publishTime": 1542902400000,
                      "privilege": {
                          "id": 1325896375,
                          "fee": 8,
                          "payed": 0,
                          "st": 0,
                          "pl": 128000,
                          "dl": 0,
                          "sp": 7,
                          "cp": 1,
                          "subp": 1,
                          "cs": false,
                          "maxbr": 999000,
                          "fl": 128000,
                          "toast": false,
                          "flag": 69,
                          "preSell": false
                      }
                  }
              ],
              "relatedInfo": null,
              "videoUserLiveInfo": null,
              "vid": "B0205F4769C6910C79A282F17071E54C",
              "durationms": 197035,
              "playTime": 757895,
              "praisedCount": 5774,
              "praised": false,
              "subscribed": false
          }
      },
      {
          "type": 1,
          "displayed": false,
          "alg": "onlineHotGroup",
          "extAlg": null,
          "data": {
              "alg": "onlineHotGroup",
              "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
              "threadId": "R_VI_62_B0635959443C772186CB5DEFD5A7BDF6",
              "coverUrl": "https://p1.music.126.net/TxpB8-3nUNRXqrrfFX2TZA==/109951164034209761.jpg",
              "height": 720,
              "width": 1280,
              "title": "赵雷《南方姑娘》现场催泪大合唱",
              "description": "赵雷《南方姑娘》现场催泪大合唱，有多少人是因为这首歌开始听民谣的？",
              "commentCount": 143,
              "shareCount": 628,
              "resolutions": [
                  {
                      "resolution": 240,
                      "size": 28874123
                  },
                  {
                      "resolution": 480,
                      "size": 47369493
                  },
                  {
                      "resolution": 720,
                      "size": 65753441
                  }
              ],
              "creator": {
                  "defaultAvatar": false,
                  "province": 350000,
                  "authStatus": 0,
                  "followed": false,
                  "avatarUrl": "http://p1.music.126.net/BqaqjmfOOP0nRhil3M2y1A==/19041342370266626.jpg",
                  "accountStatus": 0,
                  "gender": 2,
                  "city": 350100,
                  "birthday": -2209017600000,
                  "userId": 1287906511,
                  "userType": 202,
                  "nickname": "音乐奇葩君",
                  "signature": "合作联系weiqipa",
                  "description": "",
                  "detailDescription": "",
                  "avatarImgId": 19041342370266624,
                  "backgroundImgId": 109951162868126480,
                  "backgroundUrl": "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
                  "authority": 0,
                  "mutual": false,
                  "expertTags": null,
                  "experts": {
                      "1": "视频达人(华语、音乐现场)",
                      "2": "音乐图文达人"
                  },
                  "djStatus": 0,
                  "vipType": 11,
                  "remarkName": null,
                  "backgroundImgIdStr": "109951162868126486",
                  "avatarImgIdStr": "19041342370266626"
              },
              "urlInfo": {
                  "id": "B0635959443C772186CB5DEFD5A7BDF6",
                  "url": "http://vodkgeyttp9c.vod.126.net/vodkgeyttp8/DWwvfqbB_2472954189_shd.mp4?ts=1627014553&rid=D87ED31FDFFC85FD37DCE437949E7796&rl=3&rs=GxZkLDEOxkdVEbFzTlyrAeGbVVnxDerg&sign=f8a99eb129b2eda99e0c491bb99c11b0&ext=m9oSix3BSU%2B8jK%2F8Kv5f1LZdhwhXWNX%2FTwj5rvENmt0lntRB8T8YCRbcbzsEXpyOZwmRdweoI9oXWVPw3JP1sfzA4NVm74nmlBoYKu1UswtVKCclYKlGFjWHsYGoYaR5nDJc5u1iJgCDm61krKZp7jXshk3nt%2FF0Fibl%2F2EI3NVYKVVrThcRdZvsk85NVTrvmAuL1z5%2BCCeb0irmjUwF3%2F%2FyvJbEfSy9FSHkRr%2BV17nBgcxs%2BUl%2BNhYs0YYjzDhe",
                  "size": 65753441,
                  "validityTime": 1200,
                  "needPay": false,
                  "payInfo": null,
                  "r": 720
              },
              "videoGroup": [
                  {
                      "id": 58100,
                      "name": "现场",
                      "alg": null
                  },
                  {
                      "id": 59101,
                      "name": "华语现场",
                      "alg": null
                  },
                  {
                      "id": 57109,
                      "name": "民谣现场",
                      "alg": null
                  },
                  {
                      "id": 1100,
                      "name": "音乐现场",
                      "alg": null
                  },
                  {
                      "id": 2104,
                      "name": "民谣",
                      "alg": null
                  },
                  {
                      "id": 5100,
                      "name": "音乐",
                      "alg": null
                  },
                  {
                      "id": 26123,
                      "name": "赵雷",
                      "alg": null
                  }
              ],
              "previewUrl": null,
              "previewDurationms": 0,
              "hasRelatedGameAd": false,
              "markTypes": null,
              "relateSong": [
                  {
                      "name": "南方姑娘",
                      "id": 202373,
                      "pst": 0,
                      "t": 0,
                      "ar": [
                          {
                              "id": 6731,
                              "name": "赵雷",
                              "tns": [],
                              "alias": []
                          }
                      ],
                      "alia": [],
                      "pop": 100,
                      "st": 0,
                      "rt": "600902000007908509",
                      "fee": 8,
                      "v": 55,
                      "crbt": null,
                      "cf": "",
                      "al": {
                          "id": 20339,
                          "name": "赵小雷",
                          "picUrl": "http://p3.music.126.net/wldFtES1Cjnbqr5bjlqQbg==/18876415625841069.jpg",
                          "tns": [],
                          "pic_str": "18876415625841069",
                          "pic": 18876415625841068
                      },
                      "dt": 332640,
                      "h": {
                          "br": 320000,
                          "fid": 0,
                          "size": 13307864,
                          "vd": -37507
                      },
                      "m": {
                          "br": 192000,
                          "fid": 0,
                          "size": 7984736,
                          "vd": -34874
                      },
                      "l": {
                          "br": 128000,
                          "fid": 0,
                          "size": 5323172,
                          "vd": -33119
                      },
                      "a": null,
                      "cd": "1",
                      "no": 6,
                      "rtUrl": null,
                      "ftype": 0,
                      "rtUrls": [],
                      "djId": 0,
                      "copyright": 2,
                      "s_id": 0,
                      "rtype": 0,
                      "rurl": null,
                      "mst": 9,
                      "cp": 1400821,
                      "mv": 455091,
                      "publishTime": 1312646400007,
                      "privilege": {
                          "id": 202373,
                          "fee": 8,
                          "payed": 0,
                          "st": 0,
                          "pl": 128000,
                          "dl": 0,
                          "sp": 7,
                          "cp": 1,
                          "subp": 1,
                          "cs": false,
                          "maxbr": 999000,
                          "fl": 128000,
                          "toast": false,
                          "flag": 260,
                          "preSell": false
                      }
                  }
              ],
              "relatedInfo": null,
              "videoUserLiveInfo": null,
              "vid": "B0635959443C772186CB5DEFD5A7BDF6",
              "durationms": 406628,
              "playTime": 345847,
              "praisedCount": 2490,
              "praised": false,
              "subscribed": false
          }
      },
      {
          "type": 1,
          "displayed": false,
          "alg": "onlineHotGroup",
          "extAlg": null,
          "data": {
              "alg": "onlineHotGroup",
              "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
              "threadId": "R_VI_62_8D9AB3FDC199186C2931FE4402A754A1",
              "coverUrl": "https://p1.music.126.net/coQvPmYxgyNxxxbaws9svg==/109951165024149047.jpg",
              "height": 540,
              "width": 960,
              "title": "【时代少年团】EXO 《破风》Cover",
              "description": null,
              "commentCount": 22,
              "shareCount": 68,
              "resolutions": [
                  {
                      "resolution": 240,
                      "size": 26538218
                  },
                  {
                      "resolution": 480,
                      "size": 37057321
                  }
              ],
              "creator": {
                  "defaultAvatar": false,
                  "province": 110000,
                  "authStatus": 0,
                  "followed": false,
                  "avatarUrl": "http://p1.music.126.net/eD0qmHt5obsDP5Hk75mVlA==/109951165945334235.jpg",
                  "accountStatus": 0,
                  "gender": 2,
                  "city": 110101,
                  "birthday": 970164295579,
                  "userId": 2088928555,
                  "userType": 0,
                  "nickname": "TNT星球_爆米花",
                  "signature": "",
                  "description": "",
                  "detailDescription": "",
                  "avatarImgId": 109951165945334240,
                  "backgroundImgId": 109951166129400530,
                  "backgroundUrl": "http://p1.music.126.net/xL5VWzq3PWWcxsgNSUYlqg==/109951166129400534.jpg",
                  "authority": 0,
                  "mutual": false,
                  "expertTags": null,
                  "experts": null,
                  "djStatus": 0,
                  "vipType": 0,
                  "remarkName": null,
                  "backgroundImgIdStr": "109951166129400534",
                  "avatarImgIdStr": "109951165945334235"
              },
              "urlInfo": {
                  "id": "8D9AB3FDC199186C2931FE4402A754A1",
                  "url": "http://vodkgeyttp9c.vod.126.net/cloudmusic/Ddg6qkGM_3015566705_hd.mp4?ts=1627014553&rid=D87ED31FDFFC85FD37DCE437949E7796&rl=3&rs=BltKYFopbINlTAUSMrXmpYMWjLxyQxrN&sign=fdcc13cc7c646a20e172f6979c3a4a11&ext=m9oSix3BSU%2B8jK%2F8Kv5f1LZdhwhXWNX%2FTwj5rvENmt0lntRB8T8YCRbcbzsEXpyOZwmRdweoI9oXWVPw3JP1sfzA4NVm74nmlBoYKu1UswtVKCclYKlGFjWHsYGoYaR5nDJc5u1iJgCDm61krKZp7jXshk3nt%2FF0Fibl%2F2EI3NVYKVVrThcRdZvsk85NVTrvmAuL1z5%2BCCeb0irmjUwF3%2F%2FyvJbEfSy9FSHkRr%2BV17nBgcxs%2BUl%2BNhYs0YYjzDhe",
                  "size": 37057321,
                  "validityTime": 1200,
                  "needPay": false,
                  "payInfo": null,
                  "r": 480
              },
              "videoGroup": [
                  {
                      "id": 58100,
                      "name": "现场",
                      "alg": null
                  },
                  {
                      "id": 59101,
                      "name": "华语现场",
                      "alg": null
                  },
                  {
                      "id": 57108,
                      "name": "流行现场",
                      "alg": null
                  },
                  {
                      "id": 59108,
                      "name": "巡演现场",
                      "alg": null
                  },
                  {
                      "id": 1100,
                      "name": "音乐现场",
                      "alg": null
                  },
                  {
                      "id": 5100,
                      "name": "音乐",
                      "alg": null
                  }
              ],
              "previewUrl": null,
              "previewDurationms": 0,
              "hasRelatedGameAd": false,
              "markTypes": null,
              "relateSong": [],
              "relatedInfo": null,
              "videoUserLiveInfo": null,
              "vid": "8D9AB3FDC199186C2931FE4402A754A1",
              "durationms": 230668,
              "playTime": 31440,
              "praisedCount": 446,
              "praised": false,
              "subscribed": false
          }
      },
      {
          "type": 1,
          "displayed": false,
          "alg": "onlineHotGroup",
          "extAlg": null,
          "data": {
              "alg": "onlineHotGroup",
              "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
              "threadId": "R_VI_62_47EF0E4E3F1107C80707664E9E3D0279",
              "coverUrl": "https://p1.music.126.net/lWQAKcVySeP6JiArDu_g1Q==/109951163998311857.jpg",
              "height": 1080,
              "width": 1920,
              "title": "2019美国科切拉 BLACKPINK-DDU DU DDU DU&Forever Young",
              "description": "20190413 美国科切拉音乐节 BLACKPINK-DDU DU DDU DU & Forever Young",
              "commentCount": 259,
              "shareCount": 615,
              "resolutions": [
                  {
                      "resolution": 240,
                      "size": 47700480
                  },
                  {
                      "resolution": 480,
                      "size": 80808642
                  },
                  {
                      "resolution": 720,
                      "size": 119372136
                  },
                  {
                      "resolution": 1080,
                      "size": 196422476
                  }
              ],
              "creator": {
                  "defaultAvatar": false,
                  "province": 1000000,
                  "authStatus": 0,
                  "followed": false,
                  "avatarUrl": "http://p1.music.126.net/SUeqMM8HOIpHv9Nhl9qt9w==/109951165647004069.jpg",
                  "accountStatus": 0,
                  "gender": 1,
                  "city": 1010000,
                  "birthday": 631202975999,
                  "userId": 85203994,
                  "userType": 0,
                  "nickname": "用户85203994",
                  "signature": "",
                  "description": "",
                  "detailDescription": "",
                  "avatarImgId": 109951165647004060,
                  "backgroundImgId": 109951162868126480,
                  "backgroundUrl": "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
                  "authority": 0,
                  "mutual": false,
                  "expertTags": null,
                  "experts": null,
                  "djStatus": 10,
                  "vipType": 0,
                  "remarkName": null,
                  "backgroundImgIdStr": "109951162868126486",
                  "avatarImgIdStr": "109951165647004069"
              },
              "urlInfo": {
                  "id": "47EF0E4E3F1107C80707664E9E3D0279",
                  "url": "http://vodkgeyttp9c.vod.126.net/vodkgeyttp8/wH0zoMzB_2443438823_uhd.mp4?ts=1627014553&rid=D87ED31FDFFC85FD37DCE437949E7796&rl=3&rs=jxCfNcFTzPvJKeSFGEUxgBmDtrlpWEtI&sign=f02a5c8b29d0ea75ab1c8ccd37607af0&ext=m9oSix3BSU%2B8jK%2F8Kv5f1LZdhwhXWNX%2FTwj5rvENmt0lntRB8T8YCRbcbzsEXpyOZwmRdweoI9oXWVPw3JP1sfzA4NVm74nmlBoYKu1UswtVKCclYKlGFjWHsYGoYaR5nDJc5u1iJgCDm61krKZp7jXshk3nt%2FF0Fibl%2F2EI3NVYKVVrThcRdZvsk85NVTrvmAuL1z5%2BCCeb0irmjUwF3%2F%2FyvJbEfSy9FSHkRr%2BV17nBgcxs%2BUl%2BNhYs0YYjzDhe",
                  "size": 196422476,
                  "validityTime": 1200,
                  "needPay": false,
                  "payInfo": null,
                  "r": 1080
              },
              "videoGroup": [
                  {
                      "id": 58100,
                      "name": "现场",
                      "alg": null
                  },
                  {
                      "id": 1101,
                      "name": "舞蹈",
                      "alg": null
                  },
                  {
                      "id": 57107,
                      "name": "韩语现场",
                      "alg": null
                  },
                  {
                      "id": 57108,
                      "name": "流行现场",
                      "alg": null
                  },
                  {
                      "id": 1100,
                      "name": "音乐现场",
                      "alg": null
                  },
                  {
                      "id": 5100,
                      "name": "音乐",
                      "alg": null
                  },
                  {
                      "id": 92105,
                      "name": "BLACKPINK",
                      "alg": null
                  }
              ],
              "previewUrl": null,
              "previewDurationms": 0,
              "hasRelatedGameAd": false,
              "markTypes": null,
              "relateSong": [
                  {
                      "name": "DDU-DU DDU-DU",
                      "id": 1325896374,
                      "pst": 0,
                      "t": 0,
                      "ar": [
                          {
                              "id": 12068017,
                              "name": "BLACKPINK",
                              "tns": [],
                              "alias": []
                          }
                      ],
                      "alia": [],
                      "pop": 100,
                      "st": 0,
                      "rt": null,
                      "fee": 8,
                      "v": 13,
                      "crbt": null,
                      "cf": "",
                      "al": {
                          "id": 74266151,
                          "name": "BLACKPINK IN YOUR AREA",
                          "picUrl": "http://p3.music.126.net/yKysEblB7-HOVrUCjvRhqw==/109951163678530141.jpg",
                          "tns": [],
                          "pic_str": "109951163678530141",
                          "pic": 109951163678530140
                      },
                      "dt": 209493,
                      "h": {
                          "br": 320000,
                          "fid": 0,
                          "size": 8382215,
                          "vd": -30500
                      },
                      "m": {
                          "br": 192000,
                          "fid": 0,
                          "size": 5029346,
                          "vd": -28000
                      },
                      "l": {
                          "br": 128000,
                          "fid": 0,
                          "size": 3352912,
                          "vd": -26800
                      },
                      "a": null,
                      "cd": "1",
                      "no": 6,
                      "rtUrl": null,
                      "ftype": 0,
                      "rtUrls": [],
                      "djId": 0,
                      "copyright": 0,
                      "s_id": 0,
                      "rtype": 0,
                      "rurl": null,
                      "mst": 9,
                      "cp": 457010,
                      "mv": 0,
                      "publishTime": 1542902400000,
                      "privilege": {
                          "id": 1325896374,
                          "fee": 8,
                          "payed": 0,
                          "st": 0,
                          "pl": 128000,
                          "dl": 0,
                          "sp": 7,
                          "cp": 1,
                          "subp": 1,
                          "cs": false,
                          "maxbr": 999000,
                          "fl": 128000,
                          "toast": false,
                          "flag": 69,
                          "preSell": false
                      }
                  }
              ],
              "relatedInfo": null,
              "videoUserLiveInfo": null,
              "vid": "47EF0E4E3F1107C80707664E9E3D0279",
              "durationms": 492936,
              "playTime": 862683,
              "praisedCount": 7363,
              "praised": false,
              "subscribed": false
          }
      },
      {
          "type": 1,
          "displayed": false,
          "alg": "onlineHotGroup",
          "extAlg": null,
          "data": {
              "alg": "onlineHotGroup",
              "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
              "threadId": "R_VI_62_88F747D5C6242C609DDF78803ECFCD6B",
              "coverUrl": "https://p1.music.126.net/aE61rJnuAAZzh9k27KPvXQ==/109951163867915275.jpg",
              "height": 720,
              "width": 1280,
              "title": "BIGBANG《Bang Bang Bang》颁奖礼音乐现场",
              "description": "BIGBANG《Bang Bang Bang》颁奖礼音乐现场，我居然看了1分10秒的前奏.....一脸懵逼的看着几个女的在那蹦跶... 这首歌还在我歌单里...原来贼火！",
              "commentCount": 287,
              "shareCount": 322,
              "resolutions": [
                  {
                      "resolution": 240,
                      "size": 47545416
                  },
                  {
                      "resolution": 480,
                      "size": 78571758
                  },
                  {
                      "resolution": 720,
                      "size": 111220546
                  }
              ],
              "creator": {
                  "defaultAvatar": false,
                  "province": 330000,
                  "authStatus": 0,
                  "followed": false,
                  "avatarUrl": "http://p1.music.126.net/ygWgsfyGGQD8TDDrZzwG5g==/109951163650262938.jpg",
                  "accountStatus": 0,
                  "gender": 1,
                  "city": 330100,
                  "birthday": 844272000000,
                  "userId": 1664436531,
                  "userType": 0,
                  "nickname": "音乐点",
                  "signature": "投诉建议微博@音乐点",
                  "description": "",
                  "detailDescription": "",
                  "avatarImgId": 109951163650262940,
                  "backgroundImgId": 109951162868126480,
                  "backgroundUrl": "http://p1.music.126.net/_f8R60U9mZ42sSNvdPn2sQ==/109951162868126486.jpg",
                  "authority": 0,
                  "mutual": false,
                  "expertTags": null,
                  "experts": {
                      "1": "视频达人(欧美、华语、音乐现场)"
                  },
                  "djStatus": 0,
                  "vipType": 0,
                  "remarkName": null,
                  "backgroundImgIdStr": "109951162868126486",
                  "avatarImgIdStr": "109951163650262938"
              },
              "urlInfo": {
                  "id": "88F747D5C6242C609DDF78803ECFCD6B",
                  "url": "http://vodkgeyttp9c.vod.126.net/vodkgeyttp8/wZpU7qd6_2320032554_shd.mp4?ts=1627014553&rid=D87ED31FDFFC85FD37DCE437949E7796&rl=3&rs=rwlBCqyXBNifGsvITmmiRmRsFRPcUcyE&sign=2ff3db6bc2bff2200e57c3a8aeb31225&ext=m9oSix3BSU%2B8jK%2F8Kv5f1LZdhwhXWNX%2FTwj5rvENmt0lntRB8T8YCRbcbzsEXpyOZwmRdweoI9oXWVPw3JP1sfzA4NVm74nmlBoYKu1UswtVKCclYKlGFjWHsYGoYaR5nDJc5u1iJgCDm61krKZp7jXshk3nt%2FF0Fibl%2F2EI3NVYKVVrThcRdZvsk85NVTrvmAuL1z5%2BCCeb0irmjUwF3%2F%2FyvJbEfSy9FSHkRr%2BV17nBgcxs%2BUl%2BNhYs0YYjzDhe",
                  "size": 111220546,
                  "validityTime": 1200,
                  "needPay": false,
                  "payInfo": null,
                  "r": 720
              },
              "videoGroup": [
                  {
                      "id": 58100,
                      "name": "现场",
                      "alg": null
                  },
                  {
                      "id": 57107,
                      "name": "韩语现场",
                      "alg": null
                  },
                  {
                      "id": 57108,
                      "name": "流行现场",
                      "alg": null
                  },
                  {
                      "id": 59108,
                      "name": "巡演现场",
                      "alg": null
                  },
                  {
                      "id": 10114,
                      "name": "BIGBANG",
                      "alg": null
                  },
                  {
                      "id": 1100,
                      "name": "音乐现场",
                      "alg": null
                  },
                  {
                      "id": 5100,
                      "name": "音乐",
                      "alg": null
                  }
              ],
              "previewUrl": null,
              "previewDurationms": 0,
              "hasRelatedGameAd": false,
              "markTypes": [
                  101
              ],
              "relateSong": [
                  {
                      "name": "뱅뱅뱅 (BANG BANG BANG) (KR Ver._BIGBANG WORLD TOUR 2015~2016 [MADE] IN JAPAN)",
                      "id": 410629774,
                      "pst": 0,
                      "t": 0,
                      "ar": [
                          {
                              "id": 126339,
                              "name": "BIGBANG",
                              "tns": [],
                              "alias": []
                          }
                      ],
                      "alia": [],
                      "pop": 100,
                      "st": 0,
                      "rt": null,
                      "fee": 8,
                      "v": 177,
                      "crbt": null,
                      "cf": "",
                      "al": {
                          "id": 34670140,
                          "name": "BIGBANG WORLD TOUR 2015～2016 [MADE] IN JAPAN",
                          "picUrl": "http://p3.music.126.net/VTh8HTqHCIthYjeK5qCbuw==/109951163197845720.jpg",
                          "tns": [],
                          "pic_str": "109951163197845720",
                          "pic": 109951163197845730
                      },
                      "dt": 289733,
                      "h": {
                          "br": 320000,
                          "fid": 0,
                          "size": 11592142,
                          "vd": -35100
                      },
                      "m": {
                          "br": 192000,
                          "fid": 0,
                          "size": 6955302,
                          "vd": -32600
                      },
                      "l": {
                          "br": 128000,
                          "fid": 0,
                          "size": 4636883,
                          "vd": -31199
                      },
                      "a": null,
                      "cd": "1",
                      "no": 1,
                      "rtUrl": null,
                      "ftype": 0,
                      "rtUrls": [],
                      "djId": 0,
                      "copyright": 0,
                      "s_id": 0,
                      "rtype": 0,
                      "rurl": null,
                      "mst": 9,
                      "cp": 457010,
                      "mv": 0,
                      "publishTime": 1456243200007,
                      "privilege": {
                          "id": 410629774,
                          "fee": 8,
                          "payed": 0,
                          "st": 0,
                          "pl": 128000,
                          "dl": 0,
                          "sp": 7,
                          "cp": 1,
                          "subp": 1,
                          "cs": false,
                          "maxbr": 999000,
                          "fl": 128000,
                          "toast": false,
                          "flag": 69,
                          "preSell": false
                      }
                  }
              ],
              "relatedInfo": null,
              "videoUserLiveInfo": null,
              "vid": "88F747D5C6242C609DDF78803ECFCD6B",
              "durationms": 306317,
              "playTime": 952166,
              "praisedCount": 5603,
              "praised": false,
              "subscribed": false
          }
      },
      {
          "type": 1,
          "displayed": false,
          "alg": "onlineHotGroup",
          "extAlg": null,
          "data": {
              "alg": "onlineHotGroup",
              "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
              "threadId": "R_VI_62_18A875E56355CC429277998CF1BFC1D4",
              "coverUrl": "https://p1.music.126.net/Jp-iHFpFTZVSJ7UTA2M4eA==/109951163574213558.jpg",
              "height": 1080,
              "width": 1920,
              "title": "王菲最经典的一首《红豆》，一开口台下歌迷沸腾了！",
              "description": "王菲 Faye's Moments  幻乐一场 Live 2016\n\n有时候 有时候\n我会相信一切有尽头\n相聚离开 都有时候\n没有什么会永垂不朽\n可是我 有时候\n宁愿选择留恋不放手\n……\n\n           ——王菲《红豆》",
              "commentCount": 844,
              "shareCount": 2041,
              "resolutions": [
                  {
                      "resolution": 240,
                      "size": 9663665
                  },
                  {
                      "resolution": 480,
                      "size": 16702410
                  },
                  {
                      "resolution": 720,
                      "size": 26178021
                  },
                  {
                      "resolution": 1080,
                      "size": 54666359
                  }
              ],
              "creator": {
                  "defaultAvatar": false,
                  "province": 330000,
                  "authStatus": 0,
                  "followed": false,
                  "avatarUrl": "http://p1.music.126.net/-MZDEHaFdvQtdIdY2fDgyw==/109951164877618139.jpg",
                  "accountStatus": 0,
                  "gender": 1,
                  "city": 330100,
                  "birthday": 841507200000,
                  "userId": 268678989,
                  "userType": 200,
                  "nickname": "随身音乐厅",
                  "signature": "音乐的魅力，在于人的精神与音乐的共鸣。",
                  "description": "",
                  "detailDescription": "",
                  "avatarImgId": 109951164877618140,
                  "backgroundImgId": 109951165866068220,
                  "backgroundUrl": "http://p1.music.126.net/Msq8ASEUsD0nrXiDROSdmQ==/109951165866068231.jpg",
                  "authority": 0,
                  "mutual": false,
                  "expertTags": [
                      "华语"
                  ],
                  "experts": {
                      "1": "音乐视频达人",
                      "2": "生活图文达人"
                  },
                  "djStatus": 10,
                  "vipType": 11,
                  "remarkName": null,
                  "backgroundImgIdStr": "109951165866068231",
                  "avatarImgIdStr": "109951164877618139"
              },
              "urlInfo": {
                  "id": "18A875E56355CC429277998CF1BFC1D4",
                  "url": "http://vodkgeyttp9c.vod.126.net/vodkgeyttp8/oRNEMg9K_1903478928_uhd.mp4?ts=1627014553&rid=D87ED31FDFFC85FD37DCE437949E7796&rl=3&rs=KMryyovjGkTPebxiYdqAdghAVqNfzdxV&sign=03aa767fb287933b629a46dcc6d4f1f4&ext=m9oSix3BSU%2B8jK%2F8Kv5f1LZdhwhXWNX%2FTwj5rvENmt0lntRB8T8YCRbcbzsEXpyOZwmRdweoI9oXWVPw3JP1sfzA4NVm74nmlBoYKu1UswtVKCclYKlGFjWHsYGoYaR5nDJc5u1iJgCDm61krKZp7jXshk3nt%2FF0Fibl%2F2EI3NVYKVVrThcRdZvsk85NVTrvmAuL1z5%2BCCeb0irmjUwF3%2F%2FyvJbEfSy9FSHkRr%2BV17lYMFbqRExHcRCBbkC5lp5T",
                  "size": 54666359,
                  "validityTime": 1200,
                  "needPay": false,
                  "payInfo": null,
                  "r": 1080
              },
              "videoGroup": [
                  {
                      "id": 58100,
                      "name": "现场",
                      "alg": null
                  },
                  {
                      "id": 9102,
                      "name": "演唱会",
                      "alg": null
                  },
                  {
                      "id": 59101,
                      "name": "华语现场",
                      "alg": null
                  },
                  {
                      "id": 57108,
                      "name": "流行现场",
                      "alg": null
                  },
                  {
                      "id": 1100,
                      "name": "音乐现场",
                      "alg": null
                  },
                  {
                      "id": 5100,
                      "name": "音乐",
                      "alg": null
                  },
                  {
                      "id": 16127,
                      "name": "王菲",
                      "alg": null
                  }
              ],
              "previewUrl": null,
              "previewDurationms": 0,
              "hasRelatedGameAd": false,
              "markTypes": null,
              "relateSong": [
                  {
                      "name": "红豆",
                      "id": 299757,
                      "pst": 0,
                      "t": 0,
                      "ar": [
                          {
                              "id": 9621,
                              "name": "王菲",
                              "tns": [],
                              "alias": []
                          }
                      ],
                      "alia": [],
                      "pop": 100,
                      "st": 0,
                      "rt": "600902000009274126",
                      "fee": 1,
                      "v": 123,
                      "crbt": null,
                      "cf": "",
                      "al": {
                          "id": 29711,
                          "name": "Eyes On Me",
                          "picUrl": "http://p3.music.126.net/62SmuCNsZRdyY_GEZWk_Ag==/109951163416516218.jpg",
                          "tns": [],
                          "pic_str": "109951163416516218",
                          "pic": 109951163416516220
                      },
                      "dt": 260000,
                      "h": {
                          "br": 320000,
                          "fid": 0,
                          "size": 10429169,
                          "vd": -4400
                      },
                      "m": {
                          "br": 192000,
                          "fid": 0,
                          "size": 6257519,
                          "vd": -1900
                      },
                      "l": {
                          "br": 128000,
                          "fid": 0,
                          "size": 4171693,
                          "vd": -400
                      },
                      "a": null,
                      "cd": "1",
                      "no": 2,
                      "rtUrl": null,
                      "ftype": 0,
                      "rtUrls": [],
                      "djId": 0,
                      "copyright": 0,
                      "s_id": 0,
                      "rtype": 0,
                      "rurl": null,
                      "mst": 9,
                      "cp": 600011,
                      "mv": 5436053,
                      "publishTime": 917798400000,
                      "privilege": {
                          "id": 299757,
                          "fee": 1,
                          "payed": 0,
                          "st": 0,
                          "pl": 0,
                          "dl": 0,
                          "sp": 0,
                          "cp": 0,
                          "subp": 0,
                          "cs": false,
                          "maxbr": 999000,
                          "fl": 0,
                          "toast": false,
                          "flag": 260,
                          "preSell": false
                      }
                  }
              ],
              "relatedInfo": null,
              "videoUserLiveInfo": null,
              "vid": "18A875E56355CC429277998CF1BFC1D4",
              "durationms": 151600,
              "playTime": 2222771,
              "praisedCount": 7569,
              "praised": false,
              "subscribed": false
          }
      },
      {
          "type": 1,
          "displayed": false,
          "alg": "onlineHotGroup",
          "extAlg": null,
          "data": {
              "alg": "onlineHotGroup",
              "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
              "threadId": "R_VI_62_3E10978FB06564E4D59FFF816ACEA0C8",
              "coverUrl": "https://p1.music.126.net/p-HHDF4EIvPmx5pvRzBYeA==/109951163574052583.jpg",
              "height": 360,
              "width": 640,
              "title": "日本天团组合现场演唱并翻跳《极乐净土》，舞姿惊艳台下观众",
              "description": null,
              "commentCount": 414,
              "shareCount": 240,
              "resolutions": [
                  {
                      "resolution": 720,
                      "size": 71318649
                  },
                  {
                      "resolution": 480,
                      "size": 54046599
                  },
                  {
                      "resolution": 240,
                      "size": 28891318
                  }
              ],
              "creator": {
                  "defaultAvatar": false,
                  "province": 110000,
                  "authStatus": 0,
                  "followed": false,
                  "avatarUrl": "http://p1.music.126.net/kBJV7fuExIZCZlm77Y8pLA==/109951163359784378.jpg",
                  "accountStatus": 0,
                  "gender": 0,
                  "city": 110101,
                  "birthday": -2209017600000,
                  "userId": 1471157370,
                  "userType": 0,
                  "nickname": "金曲音乐厅",
                  "signature": "",
                  "description": "",
                  "detailDescription": "",
                  "avatarImgId": 109951163359784380,
                  "backgroundImgId": 109951162868128400,
                  "backgroundUrl": "http://p1.music.126.net/2zSNIqTcpHL2jIvU6hG0EA==/109951162868128395.jpg",
                  "authority": 0,
                  "mutual": false,
                  "expertTags": null,
                  "experts": {
                      "1": "泛生活视频达人"
                  },
                  "djStatus": 0,
                  "vipType": 0,
                  "remarkName": null,
                  "backgroundImgIdStr": "109951162868128395",
                  "avatarImgIdStr": "109951163359784378"
              },
              "urlInfo": {
                  "id": "3E10978FB06564E4D59FFF816ACEA0C8",
                  "url": "http://vodkgeyttp9c.vod.126.net/vodkgeyttp8/ENgXhIa0_1821686304_shd.mp4?ts=1627014553&rid=D87ED31FDFFC85FD37DCE437949E7796&rl=3&rs=ovuBpWsrIlTTKaouszJVWhrDOFbXImEB&sign=1d8ede4bccf0c912aab1bc269c256fb5&ext=m9oSix3BSU%2B8jK%2F8Kv5f1LZdhwhXWNX%2FTwj5rvENmt0lntRB8T8YCRbcbzsEXpyOZwmRdweoI9oXWVPw3JP1sfzA4NVm74nmlBoYKu1UswtVKCclYKlGFjWHsYGoYaR5nDJc5u1iJgCDm61krKZp7jXshk3nt%2FF0Fibl%2F2EI3NVYKVVrThcRdZvsk85NVTrvmAuL1z5%2BCCeb0irmjUwF3%2F%2FyvJbEfSy9FSHkRr%2BV17nBgcxs%2BUl%2BNhYs0YYjzDhe",
                  "size": 71318649,
                  "validityTime": 1200,
                  "needPay": false,
                  "payInfo": null,
                  "r": 720
              },
              "videoGroup": [
                  {
                      "id": 58100,
                      "name": "现场",
                      "alg": null
                  },
                  {
                      "id": 60101,
                      "name": "日语现场",
                      "alg": null
                  },
                  {
                      "id": 57108,
                      "name": "流行现场",
                      "alg": null
                  },
                  {
                      "id": 59108,
                      "name": "巡演现场",
                      "alg": null
                  },
                  {
                      "id": 1100,
                      "name": "音乐现场",
                      "alg": null
                  },
                  {
                      "id": 5100,
                      "name": "音乐",
                      "alg": null
                  }
              ],
              "previewUrl": null,
              "previewDurationms": 0,
              "hasRelatedGameAd": false,
              "markTypes": null,
              "relateSong": [
                  {
                      "name": "極楽浄土",
                      "id": 411907897,
                      "pst": 0,
                      "t": 0,
                      "ar": [
                          {
                              "id": 19605,
                              "name": "GARNiDELiA",
                              "tns": [],
                              "alias": []
                          }
                      ],
                      "alia": [],
                      "pop": 100,
                      "st": 0,
                      "rt": null,
                      "fee": 8,
                      "v": 506,
                      "crbt": null,
                      "cf": "",
                      "al": {
                          "id": 34686637,
                          "name": "約束 -Promise code-",
                          "picUrl": "http://p4.music.126.net/Qixxos6x5mJ4RUTH5v9DPg==/18358545649776205.jpg",
                          "tns": [],
                          "pic_str": "18358545649776205",
                          "pic": 18358545649776204
                      },
                      "dt": 218800,
                      "h": {
                          "br": 320000,
                          "fid": 0,
                          "size": 8754199,
                          "vd": -28100
                      },
                      "m": {
                          "br": 192000,
                          "fid": 0,
                          "size": 5252537,
                          "vd": -25700
                      },
                      "l": {
                          "br": 128000,
                          "fid": 0,
                          "size": 3501706,
                          "vd": -24200
                      },
                      "a": null,
                      "cd": "1",
                      "no": 2,
                      "rtUrl": null,
                      "ftype": 0,
                      "rtUrls": [],
                      "djId": 0,
                      "copyright": 0,
                      "s_id": 0,
                      "rtype": 0,
                      "rurl": null,
                      "mst": 9,
                      "cp": 1415965,
                      "mv": 5337635,
                      "publishTime": 1471363200000,
                      "privilege": {
                          "id": 411907897,
                          "fee": 8,
                          "payed": 0,
                          "st": 0,
                          "pl": 128000,
                          "dl": 0,
                          "sp": 7,
                          "cp": 1,
                          "subp": 1,
                          "cs": false,
                          "maxbr": 999000,
                          "fl": 128000,
                          "toast": false,
                          "flag": 260,
                          "preSell": false
                      }
                  }
              ],
              "relatedInfo": null,
              "videoUserLiveInfo": null,
              "vid": "3E10978FB06564E4D59FFF816ACEA0C8",
              "durationms": 201526,
              "playTime": 671334,
              "praisedCount": 2404,
              "praised": false,
              "subscribed": false
          }
      },
      {
          "type": 1,
          "displayed": false,
          "alg": "onlineHotGroup",
          "extAlg": null,
          "data": {
              "alg": "onlineHotGroup",
              "scm": "1.music-video-timeline.video_timeline.video.181017.-295043608",
              "threadId": "R_VI_62_15C494501DDA1953B03A2B905234E725",
              "coverUrl": "https://p1.music.126.net/xG3xvNaPvcnjTBH6LulcGw==/109951163573675253.jpg",
              "height": 720,
              "width": 1288,
              "title": "8年前这首歌火遍大街小巷，原唱一开口话筒罢工，尴尬了！",
              "description": "刘惜君《我很快乐》一开口话筒不给力，这是闹哪样！[大哭]",
              "commentCount": 3346,
              "shareCount": 6048,
              "resolutions": [
                  {
                      "resolution": 240,
                      "size": 19765735
                  },
                  {
                      "resolution": 480,
                      "size": 31055667
                  },
                  {
                      "resolution": 720,
                      "size": 46634769
                  }
              ],
              "creator": {
                  "defaultAvatar": false,
                  "province": 1000000,
                  "authStatus": 0,
                  "followed": false,
                  "avatarUrl": "http://p1.music.126.net/VPGeeVnQ0jLp4hK9kj0EPg==/18897306347016806.jpg",
                  "accountStatus": 0,
                  "gender": 0,
                  "city": 1002400,
                  "birthday": -2209017600000,
                  "userId": 449979212,
                  "userType": 202,
                  "nickname": "全球潮音乐",
                  "signature": "有时候音乐是陪我熬过那些夜晚的唯一朋友。",
                  "description": "",
                  "detailDescription": "",
                  "avatarImgId": 18897306347016810,
                  "backgroundImgId": 18987466300481468,
                  "backgroundUrl": "http://p1.music.126.net/qx6U5-1LCeMT9t7RLV7r1A==/18987466300481468.jpg",
                  "authority": 0,
                  "mutual": false,
                  "expertTags": null,
                  "experts": {
                      "1": "音乐视频达人",
                      "2": "华语音乐|欧美音乐资讯达人"
                  },
                  "djStatus": 0,
                  "vipType": 0,
                  "remarkName": null,
                  "backgroundImgIdStr": "18987466300481468",
                  "avatarImgIdStr": "18897306347016806"
              },
              "urlInfo": {
                  "id": "15C494501DDA1953B03A2B905234E725",
                  "url": "http://vodkgeyttp9c.vod.126.net/vodkgeyttp8/3obd13Zh_1667983824_shd.mp4?ts=1627014553&rid=D87ED31FDFFC85FD37DCE437949E7796&rl=3&rs=rgiDlVFUskjPOQoewyzuTLjxqRfLTlcR&sign=3d07b159fea5402f0979d25b537f2037&ext=m9oSix3BSU%2B8jK%2F8Kv5f1LZdhwhXWNX%2FTwj5rvENmt0lntRB8T8YCRbcbzsEXpyOZwmRdweoI9oXWVPw3JP1sfzA4NVm74nmlBoYKu1UswtVKCclYKlGFjWHsYGoYaR5nDJc5u1iJgCDm61krKZp7jXshk3nt%2FF0Fibl%2F2EI3NVYKVVrThcRdZvsk85NVTrvmAuL1z5%2BCCeb0irmjUwF3%2F%2FyvJbEfSy9FSHkRr%2BV17nBgcxs%2BUl%2BNhYs0YYjzDhe",
                  "size": 46634769,
                  "validityTime": 1200,
                  "needPay": false,
                  "payInfo": null,
                  "r": 720
              },
              "videoGroup": [
                  {
                      "id": 58100,
                      "name": "现场",
                      "alg": null
                  },
                  {
                      "id": 59101,
                      "name": "华语现场",
                      "alg": null
                  },
                  {
                      "id": 57108,
                      "name": "流行现场",
                      "alg": null
                  },
                  {
                      "id": 59108,
                      "name": "巡演现场",
                      "alg": null
                  },
                  {
                      "id": 1100,
                      "name": "音乐现场",
                      "alg": null
                  },
                  {
                      "id": 5100,
                      "name": "音乐",
                      "alg": null
                  }
              ],
              "previewUrl": null,
              "previewDurationms": 0,
              "hasRelatedGameAd": false,
              "markTypes": null,
              "relateSong": [],
              "relatedInfo": null,
              "videoUserLiveInfo": null,
              "vid": "15C494501DDA1953B03A2B905234E725",
              "durationms": 206914,
              "playTime": 8630988,
              "praisedCount": 56955,
              "praised": false,
              "subscribed": false
          }
      }
    ]
    let videoList = this.data.videoList
    videoList.push(...newVideoList)
    this.setData({
      videoList
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function ({from}) {
    // console.log(from);
    if(from === 'button') {
      return {
        title: '年年有风',
        page: 'pages/video/video',
        images: '/static/images/nvsheng.jpg'
      }
    }else {
      return {
        title: '风吹年年',
        page: 'pages/video/video',
        images: '/static/images/nvsheng.jpg'
      }
    }
    
  }
})