
import store from '@/store';
// import http from '@/common/request.js';
import sd from 'silly-datetime'
import DbQHelper from '@/utils/dbQHelper.js'
// const lyFile = uni.requireNativePlugin('LyFile');
const saveDirectory = "/storage/emulated/0/inspectData/carInfo"

function formatTime(timeStamp = '', formatStr = 'YYYY-MM-DD HH:mm:ss') {
  if (!timeStamp) return ""
  if (('' + timeStamp).length == 10) {
    timeStamp = timeStamp * 1000
  }
  return sd.format(new Date(+timeStamp), formatStr);
}
// 控制上传速度
let uploadSpeed = 800

export default class UploadQueue {
  constructor() {
    this.vinMap = new Map();
    this.waitList = [];
    this.uploadingList = [];
    this.dbQHelper = new DbQHelper();
    this.tableName = this.dbQHelper.tableName;
    (async () => await this.dbInit())()
  }

  // 反序列化
  async reStart() {
    try {
      try {
        await this.dbQHelper.dbOpen();
      } catch (e) {}
      let sqlStr = `select * from ${this.tableName} where uploadState in (1, 2)`;
      let data = await this.dbQHelper.selectSql(sqlStr);
      // 数据列表
      if (Array.isArray(data) && data.length) {
        this.waitList = [];
        this.uploadingList = [];
        data.forEach(item => {
          item.isRequesting = 0;
          switch (item.uploadState) {
            case 1:
              this.waitList.push(item)
              break;
            case 2:
              this.uploadingList.push(item)
              break;
          }
        })
      }
      console.log("this.waitList", this.waitList.length);
      if (uni.getStorageSync('userInfo')?.userId) this.queueStartProcess();
    } catch (e) {
      console.log("反序列化失败", e);
    }
  }

  // 产生新的上传任务
  async pushItem(data) {
    // 数据校验
    let {
      fileName,
      fileCode,
      filePath,
      fileType,
    } = data;
    console.log("data", data);
    if (!fileName || !fileCode || !filePath || !fileType) {
      uni.showToast({
        title: '上传数据错误',
        icon: 'none'
      })
      return
    }
    // 初始上传状态, 考虑两种状态，不需要真实发生上传的，和重传的
    let downloadState = data?.downloadState ?? 1;
    const vin = store.state.vin;
    const times = +new Date();
    const item = {
      id: `${vin}-${times}`,
      vin,
      times: formatTime(times),
      uploadedTimes: "",
      fileCode,
      fileName,
      fileType,
      filePath,
      // 上传状态 1-待上传 2-上传中 3-上传完成 4-上传失败
      uploadState: 1,
      // vin文件下载状态
      downloadState,
      // 已经上传次数
      rmoteFilePath: "",
      uploadCount: 0,
      isRequesting: 0,
      // uploadServe: http.config.baseURL
    }
    let message = '加入队列成功';
    if (await this.has(vin, fileCode)) {
      // 重传情况
      item.uploadState = 1;
      message = '重新加入上传队列';
    }
    if (['BZZ', 'WGZ'].includes(fileCode)) {
      item.uploadState = 3;
    }
    console.log("加入上传队列", item);
    // 加入待上传列表
    if (item.uploadState == 1) {
      this.waitList.push(item)
    }
    // 增量保存到数据库
    await this.dbAddQItem(item);
    setTimeout(() => {
      this.queueStartProcess();
    }, uploadSpeed)
    // 更新,触发处理操作
    console.log("message", message);
    uni.showToast({
      title: message,
      icon: 'none'
    })
  }

  // 队列处理
  async queueStartProcess() {
    // 处理队列数据状态
    await this.queueHandleDataStatus();
    for (let i = 0; i < this.uploadingList.length; i++) {
      let item = this.uploadingList[i];
      console.log("item", item);
      if (item.uploadCount <= 5 && item.isRequesting == 0 && store.state.netIsConnect) {
        if (item.fileCode == '0199') {
          this.vinRawUploadHandle(item)
        } else {
          this.uploadHandle(item)
        }
      }
    }
  }

  // 处理队列数据状态
  async queueHandleDataStatus() {
    // 从上传队列中移出
    for (let i = 0; i < this.uploadingList.length; i++) {
      let item = this.uploadingList[i]
      // 上传成功的
      if (item.uploadState == 3) {
        this.uploadingList.splice(i, 1)
        i--;
      }
      // 上传失败的
      if (item.uploadState == 4) {
        this.uploadingList.splice(i, 1)
        i--;
      }
    }

    // 向上传队列添加新的上传项目
    if (this.uploadingList.length < 1 && this.waitList.length > 0 && store.state.netIsConnect) {
      let addLength = Math.min(1 - this.uploadingList.length, this.waitList.length);
      for (let j = 0; j < addLength; j++) {
        this.waitList[j].uploadState = 2
        this.uploadingList.push(this.waitList[j])
        await this.dbUpdateQItem(this.waitList[j]);
      }
      this.waitList.splice(0, addLength);
    }
  }

  async vinRawUploadHandle(data) {
    console.log("vin上传");
    const currentStation = uni.getStorageSync('currentStation');
    const location = currentStation.org_code ? currentStation.org_code : '';
    const userInfo = uni.getStorageSync('userInfo');
    let devId = ""
    // #ifdef APP
    devId = plus.device.uuid;
    // #endif

    data.isRequesting = 1
    uni.request({
      url: data.uploadServe + '/services/vinCamera/dealPhoto',
      custom: {
        noAuth: uni.getStorageSync('noAuth') && JSON.parse(uni.getStorageSync('noAuth'))
      },
      data: {
        vin: data.vin,
        fileUrl: data.filePath,
        devId,
        userId: userInfo && userInfo.userId,
        location
      },
      sslVerify: false,
      success: async (udpRes) => {
        console.log("udpRes", udpRes);
        data.isRequesting = 0;
        if (udpRes.data.msg == "success") {
          data.uploadState = 3;
          data.uploadedTimes = formatTime(+new Date())
        } else {
          // 如果失败
          // 上传次数
          data.uploadCount += 1;
          if (data.uploadCount > 5) {
            data.uploadState = 4
          }
        }
        await this.dbUpdateQItem(data);
        setTimeout(() => {
          this.queueStartProcess();
        }, uploadSpeed)
      },
      fail: async (err) => {
        data.isRequesting = 0;
        data.uploadCount += 1;
        if (data.uploadCount > 5) {
          data.uploadState = 4
        }
        await this.dbUpdateQItem(data);
        setTimeout(() => {
          this.queueStartProcess();
        }, uploadSpeed)
      }
    })
    await this.dbUpdateQItem(data);
    setTimeout(() => {
      this.queueStartProcess();
    }, uploadSpeed)
  }

  // 上传
  async uploadHandle(data) {
    console.log("普通上传");
    let devId = ""
    // #ifdef APP
    devId = plus.device.uuid;
    // #endif
    data.isRequesting = 1
    // 上传状态 1-待上传 2-上传中 3-上传完成 4-上传失败
    // location默认值
    let location = ""
    if (!uni.getStorageSync('currentStation')) location = '0001'
    else location = uni.getStorageSync('currentStation').org_code

    data.reqBody = uni.uploadFile({
      url: data.uploadServe + '/services/singleApp/uploadImg',
      filePath: data.filePath,
      name: 'file',
      formData: {
        vin: data.vin,
        fileType: data.fileType,
        fileName: data.fileName,
        fileCode: data.fileCode,
        devId,
        userId: uni.getStorageSync('userInfo').userId,
        location
      },
      dataType: 'json',
      success: async result => {
        data.isRequesting = 0;
        console.log("result", result);
        let res = {
          data: JSON.parse(result.data)
        }
        console.log("res", res);
        if (res.data.success == "true") {
          data.uploadState = 3;
          data.rmoteFilePath = res.data.fileUrl;
          data.uploadedTimes = formatTime(+new Date())
        } else {
          // 如果失败
          // 上传次数
          data.uploadCount += 1;
          if (data.uploadCount > 5) {
            data.uploadState = 4
          }
        }
        console.log("update", data);
        await this.dbUpdateQItem(data);
        setTimeout(() => {
          this.queueStartProcess();
        }, uploadSpeed)
      },
      fail: async err => {
        data.isRequesting = 0;
        data.uploadCount += 1;
        if (data.uploadCount > 5) {
          data.uploadState = 4
        }
        console.log("update", data);
        await this.dbUpdateQItem(data);
        setTimeout(() => {
          this.queueStartProcess();
        }, uploadSpeed)
      }
    })
    await this.dbUpdateQItem(data);
    setTimeout(() => {
      this.queueStartProcess();
    }, uploadSpeed)
  }

  // db.action....................start
  async dbInit() {
    await this.dbQHelper.dbOpen();
    await this.dbQHelper.executeSql(`create table if not exists upload_queue (
      "id" TEXT,
      "vin" TEXT,
      "times" TEXT,
      "uploadedTimes" TEXT,
      "fileCode" TEXT,
      "fileName" TEXT,
      "fileType" TEXT,
      "filePath" TEXT,
      "rmoteFilePath" TEXT,
      "uploadState" integer,
      "downloadState" integer,
      "uploadCount" integer,
      "uploadServe" TEXT,
      "orgCode" TEXT,
      "orgName" TEXT,
      "userId" TEXT,
      "userName" TEXT,
      PRIMARY KEY ("vin", "fileCode"));`)
  }

  // 向db中保存队列元素，存在则更新，不存在插入
  async dbAddQItem(qItem) {
    let orgCode = uni.getStorageSync('currentStation').org_code;
    let orgName = uni.getStorageSync('currentStation').org_name;
    let userId = uni.getStorageSync('userInfo').userId
    let userName = uni.getStorageSync('userInfo').userName;

    let filePath = qItem.filePath
    if (['BZZ', 'WGZ'].includes(qItem.fileCode)) filePath = JSON.stringify(qItem.filePath)

    let sqlStr = `insert or replace into ${this.tableName} values (
      "${qItem.id}", "${qItem.vin}", "${qItem.times}", "","${qItem.fileCode}","${qItem.fileName}", 
      "${qItem.fileType}", '${filePath}', "${qItem.rmoteFilePath}", "${qItem.uploadState}", "${qItem.downloadState}",
      "${qItem.uploadCount}","${qItem.uploadServe}", "${orgCode}", "${orgName}", "${userId}", "${userName}");`

    // console.log("dbAddQItemSqlStr-qItem", qItem);
    console.log("dbAddQItemSqlStr", sqlStr);
    await this.dbQHelper.dbTStart();
    await this.dbQHelper.executeSql(sqlStr);
    await this.dbQHelper.dbTCommit();
  }

  async dbUpdateQItem(qItem) {
    let uploadedTimes = qItem?.uploadedTimes ?? ""
    let filePath = qItem.filePath
    if (['BZZ', 'WGZ'].includes(qItem.fileCode)) filePath = JSON.stringify(qItem.filePath)

    let sqlStr =
      `update ${this.tableName} set
      filePath = '${filePath}', rmoteFilePath = "${qItem.rmoteFilePath}", uploadState = "${qItem.uploadState}", uploadedTimes = "${uploadedTimes}",
      uploadCount = "${qItem.uploadCount}", uploadServe = "${qItem.uploadServe}" where vin = "${qItem.vin}" AND fileCode = "${qItem.fileCode}";`
    console.log("dbUpdateQItem", sqlStr);
    await this.dbQHelper.dbTStart();
    await this.dbQHelper.executeSql(sqlStr);
    await this.dbQHelper.dbTCommit();
  }

  async get(vin, fileCode) {
    let qSql = `select * from ${this.tableName} where vin="${vin}" and fileCode = "${fileCode}" limit 1`;
    await this.dbQHelper.dbTStart();
    let data = await this.dbQHelper.selectSql(qSql);
    await this.dbQHelper.dbTCommit();
    if (Array.isArray(data) && data.length && ['BZZ', 'WGZ'].includes(fileCode)) {
      data[0].filePath = JSON.parse(data[0].filePath);
    }
    return data?. [0]
  }

  async has(vin, fileCode) {
    let qSql = `select * from ${this.tableName} where vin="${vin}" and fileCode = "${fileCode}" limit 1`;
    await this.dbQHelper.dbTStart();
    let data = await this.dbQHelper.selectSql(qSql);
    await this.dbQHelper.dbTCommit();
    return !!(data?.length)
  }

  // 停止队列
  async stop() {
    // 等待队列情况
    this.waitList = [];
    // 进行中的停止,并清空，现有状态更新到数据库
    this.uploadingList.forEach(async item => {
      try {
        uItem.isRequesting = 0
        uItem?.reqBody.abort()
        await this.dbUpdateQItem(item);
      } catch (e) {}
    })
    this.uploadingList = [];
  }
  // 队列中删除
  async delete(item) {
    // let item = await this.dbQHelper.selectSql(
    //   `select * from ${this.tableName} where vin="${vin}" and fileCode="${fileCode}" limit 1`);
    await this.dbQHelper.executeSql(
      `delete from ${this.tableName} where vin="${item.vin}" and fileCode="${item.fileCode}"`);

    // let item = item[0];
    console.log("deleteitem", item);
    // 如果有进行中和等待的任务-s
    this.uploadingList.forEach((uItem, uidx) => {
      if (uItem.fileCode == item.fileCode && uItem.vin == item.vin) {
        try {
          uItem.isRequesting = 0
          uItem?.reqBody.abort()
        } catch (e) {}
        this.uploadingList.splice(uidx, 1)
        return;
      }
    })
    this.waitList.forEach((wItem, widx) => {
      if (wItem.fileCode == fileCode && item.vin == vin) {
        this.waitList.splice(widx, 1)
        return;
      }
    })
    // #ifdef APP-PLUS
    // 删除本地文件
    try {
      console.log("delFIle", item.filePath.substr(7));
      let File = plus.android.importClass('java.io.File');
      let file = new File(item.filePath.substr(7));
      if (file.exists()) { // 判断文件是否存在
        file.delete(); // delete()方法 你应该知道 是删除的意思;
      }
      console.log("delDirection", `${saveDirectory}/${item.vin}`);
      // lyFile.deleteFile(`${saveDirectory}/${item.vin}`, false);
    } catch (e) {
      console.log("e", `文件${item.filePath.substr(7)}删除失败`);
    }
    // #endif
  }
}
