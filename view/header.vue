<template>
<header class="navbar navbar-default navbar-fixed-top" role="navigation">
  <div class="container-fluid">
    <div class="navbar-header">
      <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target=".navbar-collapse">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
        <span class="icon-bar"></span>
      </button>
      <a class="navbar-brand" href="index.html">MyCuckoo</a>
    </div>
    <div class="navbar-collapse collapse">
      <ul class="nav navbar-nav">
          <template v-for="(item, index) in menu.first">
           <li :class="{ active: index == 0 }" @click="activeMenu"><a :href="'#' + item.moduleId + '_menu'">{{ item.modName }}</a></li>
           <li class="nav-divider"></li>
          </template>
      </ul>
      <ul class="nav navbar-nav navbar-right">
        <li>
          <a href="#" class="dropdown-toggle config" data-toggle="dropdown">
            <span class="glyphicon glyphicon-cog"></span> 常用配置<span class="caret"></span>
          </a>
          <ul class="dropdown-menu" role="menu">
            <li><router-link to="/uum/userMgr/updateUserInfo"><span class="glyphicon glyphicon-log-in"></span> 设置密码</router-link></li>
          </ul>
        </li>
        <li class="nav-divider"></li>
        <li>
          <a href="#" class="user" data-photo-url="${sessionScope.userPhotoUrl}">
          <span class="glyphicon glyphicon-user"></span> 个人中心</a>
        </li>
        <li class="nav-divider"></li>
        <li><a href="#">&nbsp;</a></li>
      </ul>
    </div>
  </div>

  <form class="form photo-upload">
    <div class="photo">
      <div class="error hidden">上传失败!</div>
      <div class="preview thumbnail"><img width="110" height="110" src=""/></div>
      <div class="progress hidden">
        <div class="progress-bar progress-bar-success progress-bar-striped" role="progressbar"
             aria-valuemin="0" aria-valuemax="100" aria-valuenow="10" style="width:10%;"></div>
      </div>
      <div class="btn-group btn-group-sm hidden">
        <button class="btn btn-primary btn-start" data-loading-text="上传中"><span
                class="glyphicon glyphicon-upload"></span>上传
        </button>
        <button class="btn btn-danger btn-cancel"><span class="glyphicon glyphicon-ban-circle"></span>取消</button>
      </div>
    </div>
    <div id="photo_picker" class="hidden"><span class="glyphicon glyphicon-picture"></span>上传头像</div>
    <a @click="doLogout" class="btn btn-danger btn-sm"><span class="glyphicon glyphicon-log-out"></span> 退出登录</a>
  </form>

</header>
</template>
<script>
export default {
  data () {
    return {

    }
  },
  created() {

  },
  mounted() {
    let $vue = this;
    // 个人中心
    var $userCenter = $('.form.photo-upload').remove();
    var $userBtn = $('.navbar .user');
    var uploader = null;
    var userPhotoUrl = '';//$userBtn.attr('data-photo-url');

    // 判断用户是否有头像
    if(userPhotoUrl) {
      $userCenter.find('img').attr('src', userPhotoUrl);
    } else {
      $userCenter.find('.photo').addClass('hidden');
      $userCenter.find('#photo_picker').removeClass('hidden');
    }

    $userBtn.popover({
        html : true,
        placement : 'bottom',
        content : $userCenter,
        trigger : 'click',
        title : '个人信息'
      }).on('shown.bs.popover', function() {
      uploader = WebUploader.create({
        server: $vue.api.postUploadLogo,
        pick: $('.navbar #photo_picker'),

        resize: false,
        accept : {
          title : 'Images',
          extensions : 'gif,jpg,jpeg,bmp,png',
          mimeTypes : 'image/*'
        },
      });
      var $photoUpload = $('.form.photo-upload');
      var $photoPicker = $photoUpload.find('#photo_picker');
      var $error = $photoUpload.find('.error');
      var $photo = $photoUpload.find('.photo');
      var $img = $photoUpload.find('img');
      var $progress = $photoUpload.find('.progress');
      var $btnGroup = $photoUpload.find('.btn-group');
      var $btnStart = $btnGroup.find('.btn-start').off();
      var $btnCancel = $btnGroup.find('.btn-cancel').off();

      $btnCancel.on('click', function() {
        uploader.stop(true);
        $photo.addClass('hidden');
        $photoPicker.removeClass('hidden');
      });
      $btnStart.on('click', function() {
        $btnStart.button('loading');
        uploader.upload();
      });

      uploader.on('beforeFileQueued', function() {
        uploader.reset();

        $btnStart.button('reset');
        $error.addClass('hidden');
        $btnGroup.removeClass('hidden');
      });
      uploader.on('fileQueued', function(file) {
        // 创建缩略图
        uploader.makeThumb(file, function(error, src) {
          if (error) {
            $error.removeClass('hidden').text('不能预览');
            return;
          }
          $img.attr('src', src);
          $photo.removeClass('hidden');
          $photoPicker.addClass('hidden');
        }, 110, 110);
      });
      uploader.on('uploadProgress', function(file, percentage) {
        $progress.removeClass('hidden').find('.progress-bar').css('width', parseInt(percentage * 100) + '%');
      });
      uploader.on('uploadSuccess', function(file, json) {
        $btnGroup.addClass('hidden');
      });
      uploader.on('uploadError', function(file) {
        $error.removeClass('hidden').text('上传失败!');
      });
      uploader.on('uploadComplete', function(file) {
        $btnStart.button('reset');
        $progress.addClass('hidden');
      });
    }).on('hidden.bs.popover', function() {
      uploader.destroy();
    });
  },
  methods: {
    activeMenu: function (el) {
      var $this = $(el.target).parent('li');
      var sidebarIdForShow = $(el.target).attr('href');
      var sidebarIdForHide = "";

      $this.siblings().each(function () {
        if ($(this).hasClass('active')) {
          $(this).removeClass('active');
          sidebarIdForHide = $(this).children('a').attr('href');
        }
      });
      $this.addClass('active');
      $(sidebarIdForHide).hide('normal', 'swing');
      $(sidebarIdForShow).show('normal', 'linear');
    },
    doLogout: function() {
      this.api.getLogout().then(data => {
        window.location = '/view/login.html';
      });
    }
  }
}
</script>