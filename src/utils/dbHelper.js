export default class DbHelper {
  openDatabase(dbName, dbFilePath) {
    return new Promise((resolve, reject) => {
      plus.sqlite.openDatabase({
        name: dbName,
        path: dbFilePath,
        success(e) {
          console.log('openDatabase success!');
          resolve(true);
        },
        fail(e) {
          console.error('openDatabase failed: ' + JSON.stringify(e));
          reject(false)
        }
      });
    })
  }

  isOpenDatabase(dbName, dbFilePath) {
    return new Promise((resolve, reject) => {
      let isOpen = plus.sqlite.isOpenDatabase({
        name: dbName,
        path: dbFilePath
      });
      console.log("isOpen", dbName, isOpen, dbFilePath);
      return resolve(isOpen)
    })
  }

  closeDatabase(dbName, dbFilePath) {
    return new Promise((resolve, reject) => {
      plus.sqlite.closeDatabase({
        name: dbName,
        success(e) {
          console.log('closeDatabase success!');
          resolve(true);
        },
        fail(e) {
          console.error('closeDatabase failed: ' + JSON.stringify(e));
          reject(false)
        }
      });
    })
  }

  transaction(dbName, operation) {
    return new Promise((resolve, reject) => {
      plus.sqlite.transaction({
        name: dbName,
        operation,
        success(e) {
          console.log('transaction start success!');
          resolve(true);
        },
        fail(e) {
          console.error('transaction start failed: ' + JSON.stringify(e));
          return reject(false);
        }
      });
    })
  }

  // 
  executeSql(dbName, sql) {
    return new Promise((resolve, reject) => {
      plus.sqlite.executeSql({
        name: dbName,
        sql,
        success(e) {
          console.log('executeSql success!');
          resolve(true);
        },
        fail(e) {
          console.error('executeSql failed: ' + JSON.stringify(e));
          return reject(false);
        }
      });
    })
  }

  selectSql(dbName, sql) {
    return new Promise((resolve, reject) => {
      plus.sqlite.selectSql({
        name: dbName,
        sql,
        success(data) {
          console.log('selectSql success: ');
          resolve(data);
        },
        fail(e) {
          console.error('selectSql failed: ' + JSON.stringify(e));
          reject(false);
        }
      });
    })
  }
}
