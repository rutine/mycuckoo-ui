const config = {
    /*
     * dev:开发模式，文件上传到工程根目录下的public目录, prod:生产模式，文件上传到nginx的文件根目录
     */
    profile : 'prod',
    url : 'http://',
    fileUploadPath : '/image/', // 文件目录
    nginxIndexPath : '/dev/dir/', // ng根目录
    fileDomain : 'http://'
};

module.exports = config;