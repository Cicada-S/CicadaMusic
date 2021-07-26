import PubSub from 'pubsub-js'
import moment from 'moment'
import request from '../../utils/request'
// 获取全局实例
const appInstance = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isPlay: false,
    song: {}, // 歌曲详情对象
    musicId: '', // 音乐的id
    musicLink: '', // 音乐的连接
    currentTime: '00:00',  // 实时时间
    durationTime: '00:00', // 总时长
    currentWidth: 0, // 实时进度条的宽度
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    // options: 用于接收路由跳转的query参数
    // 原生小程序中路由传参，对参数的长度有限制，如果传参长度过长会自动截取掉
    // console.log(JSON.parse(options.song)) 
    let musicId = options.musicId
    this.setData({
      musicId
    })
    // 获取音乐详情
    this.getMusicInfo(musicId)

    /**
     * 问题：如果用户操作系统的控制音乐播放/暂停的按钮，页面不知道，导致页面显示是否播放的状态和真实的音乐播放状态不一致
     * 解决方案： 
     *  1. 通过控制音频的实例 backgroundAudioManager 去监听音乐播放暂停
     */

    //  判断当前页面的音乐是否在播放
    if(appInstance.globalData.isMusicPlay && appInstance.globalData.musicId === musicId){
      this.setData({
        isPlay: true
      })
    }
    // 创建控制音乐播放的实例  
    // 把这个实例添加到this身上的属性，只要页面在就可以通过this这个实例访问到它，解决了跨作用域的问题
    this.backgroundAudioManager = wx.getBackgroundAudioManager()
    // 监听音乐播放/暂停/停止
    this.backgroundAudioManager.onPlay(() => {
      this.changeplayState(true)

      // 修改全局音乐播放的状态
      appInstance.globalData.musicId = musicId
    })
    this.backgroundAudioManager.onPause(() => {
      this.changeplayState(false)
    })
    this.backgroundAudioManager.onStop(() => {
      this.changeplayState(false)
    })
    
    // 监听音乐播放自然结束
    this.backgroundAudioManager.onEnded(() => {
      // 自动切换至下一首音乐，并且自动播放
      PubSub.publish('switchType', 'next')
      // 将实时进度条的长度还原为0 时间还原为0 
      this.setData({
        currentWidth: 0,
        currentTime: '00:00'
      })
    })

    // 监听音乐实时播放的进度
    this.backgroundAudioManager.onTimeUpdate(() => {
      // 格式化实时的播放时间
      let currentTime = moment(this.backgroundAudioManager.currentTime * 1000).format("mm:ss"); 
      let currentWidth = this.backgroundAudioManager.currentTime/this.backgroundAudioManager.duration * 450;
      this.setData({ 
        currentTime,
        currentWidth
      })
    })
  },

  // 修改播放状态的功能函数
  changeplayState(isPlay) {
    this.setData({
      isPlay
    })

    // 修改全局音乐播放的状态
    appInstance.globalData.isMusicPlay = isPlay
  },

  // 获取音乐详情的功能函数
  async getMusicInfo(musicId) {
    let songData = await request('/song/detail', {ids: musicId})
    // 进度条的总时长
    let durationTime = moment(songData.songs[0].dt).format("mm:ss"); 
    this.setData({
      song: songData.songs[0],
      durationTime
    })

    // 动态修改窗口的标题
    wx.setNavigationBarTitle({
      title: this.data.song.name
    })
  },

  // 点击播放/暂停的回调
  handleMusicPlay(){
    let isPlay = !this.data.isPlay
    // // 修改是否播放的状态
    // this.setData({
    //   isPlay
    // })
    
    let {musicId, musicLink} = this.data
    // 控制音乐播放/暂停
    this.musicControl(isPlay, musicId, musicLink)
  },

  // 控制音乐播放/暂停的功能函数
  async musicControl(isPlay, musicId, musicLink){
    // this.musicId != musicId
    if(isPlay) { // 音乐播放
      if(!musicLink){
        // 获取音乐播放链接
        let musicLinkData = await request('/song/url', {id: musicId})
        musicLink = musicLinkData.data[0].url

        this.setData({
          musicLink
        })
      }
      this.backgroundAudioManager.src = musicLink;
      this.backgroundAudioManager.title = this.data.song.name
    }else { // 音乐暂停
      this.backgroundAudioManager.pause();
    }
  },

  // 切换歌曲的回调  
  handleSwitch(event){
    let type = event.currentTarget.id
    // 关闭当前播放的音乐
    this.backgroundAudioManager.stop();
    // 订阅来自recommendSong页面发布的musicId信息
    PubSub.subscribe('musicId', (msg, musicId) => {
      this.setData({
        musicId
      })
      // 获取音乐详情
      this.getMusicInfo(musicId)
      // 控制音乐播放/暂停
      this.musicControl(true, musicId)

      // 取消订阅
      PubSub.unsubscribe('musicId');
    })
    // 发布信息数据给recommendSong页面
    PubSub.publish('switchType', type)
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
  onShareAppMessage: function () {

  }
})