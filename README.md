# export-data

## Project setup
```
npm  install
```
手机上直接运行标准基座, 运行标准基座，文件导出的路径在/Android/data/io.dcloud.HBuilder/documents 下，运行自定义调试基座，导出的文件的位置在/Android/data/包名/documents  下

### Customize configuration
See [Configuration Reference](https://cli.vuejs.org/config/).

### 常见问题
打不开数据库报如下错误
unknown error (Sqlite code 14 SQLITE_CANTOPEN): Could not open database, (OS error - 13:Permission denied)
是手机存储权限没有允许的问题, 添加 android.permission.READ_EXTERNAL_STORAGE 和 android.permission.WRITE_EXTERNAL_STORAGE 权限
