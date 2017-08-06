const fs = require('fs');
const logger = require('log4js').getLogger('service.common.common-util.js');

const conf = require('../../config');


const common =  function() {

}

common.isUrl = function(url){
    var regex = /^(http:\/\/)/;
    return regex.test(url);
}

common.isFunction = function(obj){
    if(typeof obj === 'function'){
        return true;
    }
    return false;
}

Date.prototype.format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
    if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

//创建多级文件夹
common.mkdirsSync = function(dirpath, mode) {
    if(fs.existsSync(dirpath)){
        return;
    }
    var dirs;
    if(dirpath.indexOf('\\') > -1){
        dirs = dirpath.split('\\');
    }else{
        dirs = dirpath.split('/');
    }
    var temPath = '/';
    if(conf.profile === 'dev'){
        temPath = '';
    }
    for(var p in dirs){
        if(dirs[p]){
            temPath += dirs[p] + '/';
            if(!fs.existsSync(temPath)){
                fs.mkdirSync(temPath, mode);
            }
        }
    }
}

common.getUploadImg = function(dirpath){
    var date = new Date();
    dirpath += date.getFullYear() + '/';
    dirpath += date.getMonth() + 1 + '/';
    dirpath += date.getDate() + '/';
    common.mkdirsSync(dirpath, 0777);
    return dirpath;
}

module.exports = common;