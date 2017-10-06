<template>
  <div class="row">
    <div class="col-sm-12 col-md-12">
      <h3 class="page-header">系统公告管理</h3>
      <!-- 表单操作按钮 -->
      <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>

      <form name="editForm" action="editForm" method="post" class="form form-inline">
        <input type="hidden" name="afficheId" v-model="formData.afficheId"/>
        <div class="jumbotron" style="margin-bottom:10px; padding:15px; font-size:12px;">
          <p><strong class="text-info">公告信息</strong></p>
          <table class="table">
            <tr>
              <td width=14%><label>公告标题</label></td>
              <td><input type=text name="afficheTitle" v-model="formData.afficheTitle"
                         class="form-control required" maxlength="100"/></td>
              <td width=14%><label>有效日期</label></td>
              <td>
                <div id="affiche_invalidate" class="input-group date">
                  <input type="text" class="form-control required" name="afficheInvalidate"
                         v-model="formData.afficheInvalidate" readOnly />
                  <span class="input-group-addon"><span class="glyphicon glyphicon-remove"></span></span>
                  <span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>
                </div>
              </td>
            </tr>
            <tr>
              <td width=14%><label>是否发布</label></td>
              <td colspan="3">
                <label class="radio-inline">
                  <input type="radio" name="affichePulish" value="0" v-model="formData.affichePulish"> 是&nbsp;&nbsp;
                </label>
                <label class="radio-inline">
                  <input type="radio" name="affichePulish" value="1" v-model="formData.affichePulish"> 否&nbsp;&nbsp;
                </label>
              </td>
            </tr>
            <tr>
              <td width=14%><label>公告正文</label></td>
              <td colspan="3">
                <textarea rows="6" name="afficheContent" class="form-control" v-model="formData.afficheContent"></textarea>
              </td>
            </tr>
          </table>
        </div>
      </form>
      <div class="jumbotron" style="margin-bottom:10px; padding:15px; font-size:12px;">
        <p>
          <strong class="text-info">公告附件</strong>&nbsp;&nbsp;
        </p>
        <div v-if="config.action != 'view'" id="file_picker"><span class="glyphicon glyphicon-plus"></span> 添加文件</div>
        <table class="table table-condensed file-list">
            <tr v-for="accessory in formData.accessories"
                :id="accessory.file ? accessory.file.id : ''" class="template-download fade in">
              <td width="25%" class="name">
                <span v-if="!accessory.file">
                  <a :href="downloadUrl + '?business=document&fileName=' + accessory.accessoryName">
                    <img :src="getThumbnail(accessory.accessoryName)">&nbsp;&nbsp;
                    <span>{{ accessory.accessoryName }}</span>
                  </a>
                </span>
                <span v-else="">
                   <img :src="getThumbnail(accessory.accessoryName)">&nbsp;&nbsp;
                    <span>{{ accessory.accessoryName }}</span>
                </span>
              </td>
              <td width="8%" class="size">{{ accessory.size ? accessory.size : ''}}</td>
              <td>
                <div v-if="accessory.file != null">
                  <button class="btn btn-info btn-sm start" data-loading-text="正在上传..." @click="upload(accessory.file, $event)">开始上传
                    <span class="glyphicon glyphicon-upload"></span>
                  </button>
                  <button class="btn btn-warning btn-sm cancel" @click="cancel(accessory.file, $event)">取消
                    <span class="glyphicon glyphicon-ban-circle"></span>
                  </button>
                </div>
                <div v-else-if="config.action != 'view'">
                  <button class="btn btn-danger btn-sm delete"
                          @click="deleteAccessory(accessory.accessoryId)">
                    <span class="glyphicon glyphicon-trash"></span>
                  </button>
                </div>
              </td>
              <td>
                <div v-if="accessory.file != null" class="progress hidden">
                  <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar" style="width:0%;"></div>
                </div>
              </td>
            </tr>
        </table>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  props: {
    config: Object
  },
  data() {
    if (this.config.id > -1) {
      this.api.afficheMgr.view(this.config).then(data => {
        this.formData = data;
      });
    }
    return {
      formData: {
        afficheId: null,
        afficheTitle: null,
        afficheInvalidate: null,
        affichePulish: null,
        afficheContent: null,
        accessories: []
      },
      uploader: null,
      downloadUrl: this.api.download
    }
  },
  mounted() {
    if (this.config.id > -1) {
      this.api.afficheMgr.view(this.config).then(data => {
        this.formData = data;

        this.init(data.afficheId);
      });
    }
  },
  methods: {
    init(id) {
      let $vue = this;

      // 公告时间选择
      let $html = $(this.$el);
      let $fileList = $html.find('table.file-list');
      $html.find('#affiche_invalidate').datetimepicker({
        language: 'zh-CN',
        format: 'yyyy-mm-dd',
        autoclose: 1,
        todayHighlight: 1,
        todayBtn: 'linked',
        startView: 2,
        minView: 2,
        forceParse: 0
      });

      // 文件上传
      $vue.uploader = WebUploader.create({
        server: $vue.api.postFile,
        pick: $html.find('#file_picker'),
        resize: false,
        formData: {
          business: 'document'
        }
      });
      // 当有文件被添加进队列的时候
      $vue.uploader.on('fileQueued', function(file) {
        $vue.formData.accessories.push({
          accessoryName: file.name,
          size: WebUploader.Base.formatSize(file.size),
          file: file
        })
      });
      $vue.uploader.on('uploadProgress', function(file, percentage) {
        var $percent = $fileList.find('#' + file.id).find('.progress .progress-bar').parent().removeClass('hidden').end();
        $percent.css('width', percentage * 100 + '%');
        $percent.text(parseInt(percentage * 100) + '%');
      });
      $vue.uploader.on('uploadSuccess', function(file, json) {
        if(!json || !json.data) return;

        file = MyCuckoo.apply(file, json.data);
        $vue.formData.accessories.forEach(item => {
          if(item.file && file.id == item.file.id) {
            item.file = null;
            item.accessoryId = file.url;
            item.accessoryName = file.name;
          }
        });
      });
      $vue.uploader.on('uploadError', function(file) {
        $fileList.find('#' + file.id).find('td:eq(2)').addClass('error').html('上传出错!');
        $fileList.find('#' + file.id).find('td:eq(3) .progress').fadeOut();
        $fileList.find('#' + file.id).find('td:eq(4)) .btn').off().remove();
      });
    },
    // 附件图标
    getThumbnail(fileName) {
      var splitFlag = fileName.indexOf('_');
      fileName = fileName.substr(splitFlag + 1);
      var suffixName = fileName.substr(fileName.lastIndexOf('.') + 1);
      var imgPictureUrl = '/public/static/images/button/no-format.png';
      if (suffixName == 'docx' || suffixName == 'doc') {
        imgPictureUrl = '/public/static/images/button/word.png';
      } else if (suffixName == 'pdf') {
        imgPictureUrl = '/public/static/images/button/pdf.png';
      } else if (suffixName == 'pptx' || suffixName == 'ppt') {
        imgPictureUrl = '/public/static/images/button/powerpoint.png';
      } else if (suffixName == 'xlsx' || suffixName == 'xls') {
        imgPictureUrl = '/public/static/images/button/excel.png';
      }
      return imgPictureUrl;
    },
    // 删除附件
    deleteAccessory(accessoryId) {
      let $vue = this;
      this.api.accessoryMgr.del({fileNameOrId: accessoryId}).then(data => {
        $vue.formData.accessories.forEach((item, index) => {
          if(item.accessoryId == accessoryId) {
            $vue.formData.accessories.splice(index, 1);
          }
        });

        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});
      });
    },
    // 下载附件
    download(accessoryName) {
      let $vue = this;
      this.api.fileMgr.download({business: 'document', fileName: accessoryName}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});
      });
    },
    // 上传
    upload(file, event) {
//      $(event.target).button('loading');
      this.uploader.upload(file);
    },
    cancel(file, event) {
//      $(event.target).prev().button('reset');
      this.uploader.cancelFile(file);
    },

    operator(fn) {
      eval('this.' + fn + '()');
    },
    create() {
      let $vue = this;
      let params = JSON.parse(JSON.stringify(this.formData));
      params.accessories.forEach(item => {
        item.accessoryName = item.accessoryId;
        item.accessoryId = null;
      });

      this.api.afficheMgr.create(params).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

        $vue.$emit('refresh');
        this.reback();
      });
    },
    update() {
      let $vue = this;
      let params = JSON.parse(JSON.stringify(this.formData));
      params.accessories.forEach(item => {
        if(isNaN(item.accessoryId)) {
          item.accessoryName = item.accessoryId;
          item.accessoryId = null;
        }
      });
      this.api.afficheMgr.update(params).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

        $vue.$emit('refresh');
        this.reback();
      });
    },
    reback() {
      this.config.view = '';
    }
  }
}
</script>