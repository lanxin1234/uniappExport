import DbHelper from '@/utils/dbHelper.js'
export default class DbQHelper {
  constructor() {
    this.dbHelper = new DbHelper();
    this.dbName = 'preCollect';
    this.tableName = 'upload_queue';
    this.dbFilePath = '/storage/emulated/0/inspectData/preCollect.db'
  }

  async dbOpen() {
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
