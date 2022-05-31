<template>
  <view class="media-item">
    <view class="media-info">
      <view class="vin-info">
        <view class="vin-info-top">
          <text class="media-title">VIN：{{ newsItem.vin }}</text>
          <text class="info-text" :class="'text' + newsItem.uploadState">{{ getStatusName(newsItem) }}</text>
        </view>
        <text class="vin-time">采集项：{{ newsItem.fileName }}</text>
        <text class="vin-time">采集时间：{{ newsItem.times }}</text>
      </view>
    </view>
    <view class="media-item-line" style="position: absolute"></view>
  </view>
</template>

<script>
  export default {
    props: {
      newsItem: {
        type: Object,
        default: function(e) {
          return {};
        }
      }
    },
    data() {
      return {
        statusColor: ''
      }
    },
    methods: {
      getStatusName(item) {
        let statusName = '';
        switch (
          item.uploadState // 1-待上传 2-上传中 3-上传完成 4-上传失败
        ) {
          case 1:
            statusName = '待上传';
            break;
          case 2:
            statusName = '上传中';
            break;
          case 3:
            statusName = '已上传';
            break;
          case 4:
            statusName = '上传失败';
            break;
        }
        return statusName;
      },
      click() {
        this.$emit('click');
      },
      close(e) {
        e.stopPropagation();
        this.$emit('close');
      }
    }
  };
</script>

<style scoped lang="scss">
  .media-item {
    padding: 30rpx 0;
    border-bottom: 1px solid #ececec;
  }

  .media-title {
    font-size: 32upx;
    font-weight: 500;
    text-align: left;
  }

  .vin-time {
    margin-top: 20upx;
    font-size: 28upx;
    color: #999;
    font-weight: normal;
    margin-bottom: 0rpx;
    text-align: left;
  }

  .uni-list-cell-hover {
    background-color: #eeeeee;
  }

  .media-info {
    box-sizing: border-box;
    position: relative;
  }

  .icon-img {
    display: inline-block;
    margin: 0 auto;
    margin-bottom: 14upx;
    width: 57upx;
    height: 44upx;
  }

  .vin-info {
    display: flex;
    flex-direction: column;
  }

  .vin-info-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .info-text {
    display: inline-block;
    min-width: 60upx;
    padding: 4upx 12upx;
    margin-left: 28upx;
    color: #fff;
    // text-align: center;
    font-size: 10px;
    border-radius: 32upx;

    //-------上传状态颜色 1-待上传 2-上传中 3-上传完成 4-上传失败
    &.text1,
    &.text2 {
      color: $uni-color-warning;
      background-color: rgba($color: $uni-color-warning, $alpha: 0.2);
    }

    &.text3 {
      color: $active-color;
      background-color: rgba($color: $active-color, $alpha: 0.2);
    }

    // 上传失败
    &.text4 {
      color: $uni-color-error;
      background-color: rgba($color: $uni-color-error, $alpha: 0.2);
    }

    // -----------图片状态颜色
    &.text-success {
      color: $active-color;
      background-color: rgba($color: $active-color, $alpha: 0.2);
    }

    // 生成中，审核中
    &.text-gening,
    &.text-loading,
    &.text-checking {
      color: $uni-color-warning;
      background-color: rgba($color: $uni-color-warning, $alpha: 0.2);
    }

    // 生成失败，审核失败
    &.text-error,
    &.text-gerror {
      color: $uni-text-color-placeholder;
      background-color: rgba($color: $uni-text-color-placeholder, $alpha: 0.2);
    }
  }

  .close-view {
    position: relative;
    align-items: center;
    flex-direction: row;
    width: 20px;
    height: 15px;
    line-height: 15px;
    border-width: 1upx;
    border-style: solid;
    border-color: #aaaaaa;
    border-radius: 4px;
    justify-content: center;
    text-align: center;
  }

  .close-l {
    position: absolute;
    width: 9px;
    height: 1px;
    background-color: #aaaaaa;
  }

  .close-h {
    transform: rotate(45deg);
  }

  .close-v {
    transform: rotate(-45deg);
  }
</style>
