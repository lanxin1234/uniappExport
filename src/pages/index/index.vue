<template>
  <view class="wrapper">
    <view class="text-tip">
      <view class="">
        文件位置
      </view>
      <view class="path-box">{{$store.state.savePath}}</view>
    </view>
    <view class="example-body">
      <view class="text-tip">
        按日期范围搜索
      </view>
      <view class="reset-box">
        <button @click="getTodayDate">重置</button>
      </view>
    </view>
    <!-- 日期范围用法：type: range -->
    <uni-datetime-picker v-model="timeRange" type="datetimerange" rangeSeparator="至" @change="dateChange" />
    <view class="data-box">
      <view class="text-tip">
        共搜索出{{count}}条数据
      </view>
      <view class="export-btn" @click="handleDownload(null)">
        导出
      </view>
    </view>
    <scroll-view class="record-box" scroll-y="true" :style="{ height: sHeight + 'px' }">
      <view class="" v-for="(arr, key, index) in groupDataArr" :key="index">
        <view class="item-top">
          <view>{{ arr[0] }}</view>
        </view>
        <view class="item-label-box" v-for="(item, i) in arr[1]" :key="i">
          <newsItem :newsItem="item"></newsItem>
        </view>
      </view>
      <view style="height: 140rpx"></view>
      <!-- <view class="no-data" v-if="count === 0">
        暂无数据
      </view> -->
    </scroll-view>
  </view>
</template>

<script>
  import exportExcel from '@/utils/exportExcel.js';
  import moment from 'moment';
  import newsItem from './news-item.vue';
  export default {
    components: {
      newsItem,
    },
    data() {
      return {
        title: 'Hello',
        backButtonPress: 0,
        timeRange: [],
        count: 0,
        today: '',
        sHeight: 0,
        groupDataArr: [],
        resultList: [],
        fileName:''
      }
    },
    onLoad() {

    },
    onShow() {
      this.dbQHepler = this.$uploadQueue.dbQHelper;
      this.tableName = this.dbQHepler.tableName;
      this.today = moment().format('YYYY-MM-DD');
      let system = uni.getSystemInfoSync();
      this.sHeight = system.windowHeight - system.iPhoneXBottomHeightPx - system.statusBarHeight - uni.upx2px(180);
      let date = new Date();
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      let savePath = `/Android/data/uni.UNI11A0E0C/documents/项目Excel文件/${year}年${month}月`
      this.$store.commit('SET_SUCCESSTIP', savePath)
      this.getTodayDate();
    },
    methods: {
      async getTodayDate() {
        // let startTime = moment().startOf('day').format('YYYY-MM-DD HH:mm:ss');
        // let endTime = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
        let startTime = moment().subtract(1, 'days').format('YYYY-MM-DD ')+ '18:00:00';
        let endTime = moment().format('YYYY-MM-DD ')+ '18:00:00';
        this.timeRange = [startTime, endTime]
        let qRes = await this.dbQHepler.selectSql(
          `select * from ${this.tableName}  where times >= '${startTime}' AND times<= '${endTime}' order by times desc`
          );
        this.count = qRes.length;
        this.mapData(qRes);
        this.resultList = qRes;
        // this.fileName = moment().endOf('day').format('MDD');
        this.fileName = 'PDA记录_'+[moment().subtract(1, 'days').format('M月DD日')+'18:00:00',moment().format('M月DD日')+'18:00:00'].join('-')+'_'+ plus.device.imei;
        plus.device.getInfo({
        		success:function(e){
        			console.log('getDeviceInfo success: '+JSON.stringify(e));
        		},
        		fail:function(e){
        			console.log('getDeviceInfo failed: '+JSON.stringify(e));
        		}
        	});
      },
      async getRangeDate() {
        let qRes = await this.dbQHepler.selectSql(
          `select * from ${this.tableName}  where times >= '${this.timeRange[0]}' AND times<= '${this.timeRange[1]}' order by times desc`
        );
        this.count = qRes.length;
        this.mapData(qRes);
        this.resultList = qRes;
      },
      //数据导出
      handleDownload() {
        const tHeader = ['VIN', '扫码时间','拍照完成时间','上传预采集开始时间','上传预采集完成时间', '耗时','状态', '上传次数', '采集项', '查验工位', '采集用户', '文件路径'];
        const filterVal = ['vin', 'scanTime','times', 'uploadStartTime','uploadedTimes','consumed','uploadStateName', 'uploadCount', 'fileName', 'orgName', 'userName',
          'filePath'
        ];
        //导出选中的数据
        let checkedList = [...this.resultList];
        checkedList.forEach(item => {
          item.uploadCount = item.uploadCount === 0 ? 1 : item.uploadCount;
          item.uploadStateName = getStatus(item.uploadState);
          item.consumed = getTimeConsumed(item.scanTime, item.uploadedTimes)
          //1-待上传 2-上传中 3-上传完成 4-上传失败
        })

        function getStatus(value) {
          let status = '';
          switch (value) {
            case 1:
              status = '上传中'
              break;
            case 2:
              status = '上传中'
              break;
            case 3:
              status = '已完成'
              break;
            case 4:
              status = '上传失败'
              break;
            default:
              break;
          }
          return status;
        }
        //数据格式化
        exportExcel(tHeader, filterVal, checkedList, this.fileName)
        // 添加耗时时间计算
        function getTimeConsumed(startTime, endTime){
            if(!startTime || !endTime) return 0
            let times = moment(new Date(endTime)).diff(moment(new Date(startTime)),'seconds');
            return times
        }
      },
      checkStatus(data) {
        let res = data.filter(item => {
          return !item.checked
        })
        return res.length > 0 ? "选择" : "取消";
      },
      dateChange(time) {
        this.timeRange = time;
        this.fileName='PDA记录_'+ [moment(this.timeRange[0]).format('M月DD日HH:mm:ss'),moment(this.timeRange[1]).format('M月DD日HH:mm:ss')].join('-')+'_'+ plus.device.imei;
        this.getRangeDate()
      },
      //数据分组
      mapData(resultList) {
        // 利用 map 的有序性（如果是 js 对象，会因为 js 对象键无序而“被排序”（类似ascii码），无法保持插入顺序）
        const data = [...resultList];
        let groupData = new Map()
        data.forEach(item => {
          // 将数据自带的时间字段分割成两段，日期用于分组，时间用于展示
          let [date, time] = item.times.split(" ")
          item.date = date
          item.time = time
          if (!groupData.has(date)) {
            groupData.set(date, [item])
          } else {
            groupData.get(date).push(item)
          }
        })
        this.groupDataArr = [...groupData.entries()]
      },
    },
    async onBackPress() {
      console.log("onBackPress-backButtonPress");
      this.backButtonPress++;
      if (this.backButtonPress > 1) {
        await this.$uploadQueue.dbQHelper.dbClose();
        plus.runtime.quit();
      } else {
        plus.nativeUI.toast('再按一次退出应用');
      }
      setTimeout(() => {
        this.backButtonPress = 0;
      }, 1000);
    }
  }
</script>

<style lang="scss" scoped>
  .wrapper {
    padding: 60rpx;
    // display: flex;
    // flex-direction: column;
    // justify-content: center;
    box-sizing: border-box;
  }

  .path-box {
    margin-top: 20rpx;
    margin-bottom: 30rpx;
    padding: 30rpx;
    overflow-wrap: break-word;
    color: #fff;
    background-color: #bbb;
  }

  .title {
    margin-bottom: 40rpx;
    font-size: 36rpx;
    color: #8f8f94;
  }

  .btn-box button {
    margin-bottom: 40rpx;
  }

  .text-tip {
    color: #999;
    margin: 20rpx 0;
  }

  .no-data {
    color: #999;
    text-align: center;
  }

  .record-box {
    background-color: #ffffff;
  }

  .item {
    border-radius: 20upx;
    text-align: center;
  }

  .item-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    font-size: 32upx;
    padding: 20upx 0upx;
    font-weight: bold;
    background-color: #f6faff;
  }

  .select-text {
    font-size: 32upx;
  }

  .export-btn {
    padding: 30rpx 0;
    margin-bottom: 40rpx;
    text-align: center;
    background-color: $active-color;
    border-radius: 20rpx;
    color: #fff;
  }
  .reset-box button{
      font-size: 28rpx;
    }
  .example-body{
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
  
</style>
