import DbHelper from '@/utils/dbHelper.js'
import{requestAndroidPermission, gotoAppPermissionSetting} from '@/utils/permission.js'
export default class DbQHelper {
  constructor() {
    this.dbHelper = new DbHelper();
    this.dbName = 'preCollect';
    this.tableName = 'upload_queue';
    this.dbFilePath = '/storage/emulated/0/inspectData/preCollect.db'
  }

  async dbOpen() {
    let result = await requestAndroidPermission('android.permission.READ_EXTERNAL_STORAGE');
    let result2 = await requestAndroidPermission('android.permission.WRITE_EXTERNAL_STORAGE');
    // //若所需权限被拒绝,则打开APP设置界面,可以在APP设置界面打开相应权限
    if (result == -1) {
      gotoAppPermissionSetting()
    }
    let isOpen = await this.dbHelper.isOpenDatabase(this.dbName, this.dbFilePath)
    if (!isOpen)
      await this.dbHelper.openDatabase(this.dbName, this.dbFilePath)
  }

  async dbClose() {
    let isOpen = await this.dbHelper.isOpenDatabase(this.dbName, this.dbFilePath)
    if (isOpen) {
      await this.dbHelper.closeDatabase(this.dbName, this.dbFilePath)
    }
  }

  async selectSql(qSqlStr) {
    let data = await this.dbHelper.selectSql(this.dbName, qSqlStr);
    return data
  }

  async executeSql(SqlStr) {
    await this.dbHelper.executeSql(this.dbName, SqlStr);
  }

  async dbTStart() {
    await this.dbHelper.transaction(this.dbName, 'begin');
  }

  async dbTCommit() {
    await this.dbHelper.transaction(this.dbName, 'commit');
  }
}
