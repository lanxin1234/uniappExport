import store from "@/store";
const formatNumber = n => {
  n = n.toString()
  return n[1] ? n : '0' + n
}
const formatTime = (date, lab = '') => {
  const year = date.getFullYear()
  const month = date.getMonth() + 1
  const day = date.getDate()
  return [year, month, day].map(formatNumber).join(lab)
}

// 导出文件到手机 fileData:要写入到文件的数据，返回参数为文档路径
function exportFile(fileData, name,documentName = "项目Excel文件") {
  /*
  PRIVATE_DOC: 应用私有文档目录常量
  PUBLIC_DOCUMENTS: 程序公用文档目录常量
  */
  plus.io.requestFileSystem(plus.io.PUBLIC_DOCUMENTS, function(fs) {

    let rootObj = fs.root;
    let fullPath = rootObj.fullPath;
    // let reader = rootObj.createReader();
    // console.log(reader);
    // reader.readEntries((res)=>{
    //     console.log(res); //这里拿到了该目录下所有直接文件和目录
    // },(err)=>{console.log(err);})
    // 创建文件夹
    rootObj.getDirectory(documentName, {
      create: true
    }, function(dirEntry) {
      //获取当前的年月继续创建文件夹
      let date = new Date();
      let year = date.getFullYear();
      let month = date.getMonth() + 1;
      dirEntry.getDirectory(`${year}年${month}月`, {
        create: true
      }, function(dirEntry2) {
        // 创建文件,防止重名，按照日期名称 

        let fileName = name + "_PDA";
        console.log(fileName);
        dirEntry2.getFile(`${fileName}.xlsx`, {
          create: true
        }, function(fileEntry) {
          fileEntry.createWriter(function(writer) {
            writer.onwritestart = (e) => {
              uni.showLoading({
                title: "正在导出",
                mask: true
              })
            }

            //  /storage/emulated/0指的就是系统路径
            let pathStr = fullPath.replace("/storage/emulated/0", "");
            writer.onwrite = (e) => {
              // 成功导出数据;
              uni.hideLoading();
              setTimeout(() => {
                const successTip = `${pathStr}${documentName}/${year}年${month}月`;
                store.commit('SET_SUCCESSTIP',successTip)
                uni.showToast({
                  title: "导出成功",
                  icon: "success"
                })
                uni.hideLoading()
              }, 500)

            };
            // 写入内容;
            writer.write(fileData);

          }, function(e) {
            console.log(e.message);
          });
        });
      })

    });

  });
}

function exportExcel(tHeader,filterVal,jsonData, fileName) {
  //列标题
  let worksheet = "sheet1";
  let str = '<tr>';
  for (let i = 0; i<tHeader.length;i++) {
    str+=`<td>${tHeader[i]}</td>`
  }
  str+='</tr>'
  //循环遍历，每行加入tr标签，每个单元格加td标签
  for (let j = 0; j < jsonData.length; j++) {
    str += '<tr>';
    for (let item in filterVal) {
      //增加	为了不让表格显示科学计数法或者其他格式
      str += `<td>${ jsonData[j][filterVal[item]] + '	'}</td>`;
    }
    str += '</tr>';
  }
  //下载的表格模板数据
  let template = `<html xmlns:o="urn:schemas-microsoft-com:office:office" 
        xmlns:x="urn:schemas-microsoft-com:office:excel" 
        xmlns="http://www.w3.org/TR/REC-html40">
        <head><!--[if gte mso 9]><xml encoding="UTF-8"><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet>
        <x:Name>${worksheet}</x:Name>
        <x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet>
        </x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
        </head><body><table>${str}</table></body></html>`;
  //下载模板
  exportFile(template,fileName);
}
export default exportExcel;
