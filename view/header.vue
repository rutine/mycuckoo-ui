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
           <li :class="{ active: index == 0 }" @click="active"><a :href="'#' + item.moduleId + '_menu'">{{ item.modName }}</a></li>
           <li class="nav-divider"></li>
          </template>
      </ul>
      <ul class="nav navbar-nav navbar-right">
        <li>
          <a href="#" class="dropdown-toggle config" data-toggle="dropdown">
            <span class="glyphicon glyphicon-cog"></span> 常用配置<span class="caret"></span>
          </a>
          <ul class="dropdown-menu" role="menu">
            <li><router-link to="/userCommFunMgr/index"><span class="glyphicon glyphicon-tasks"></span> 设置常用功能</router-link></li>
            <li><router-link to="/userAgentMgr/index"><span class="glyphicon glyphicon-dashboard"></span> 设置代理</router-link></li>
            <li><router-link to="/uum/userMgr/updateUserInfo"><span class="glyphicon glyphicon-log-in"></span> 设置密码</router-link></li>
          </ul>
        </li>
        <li class="nav-divider"></li>
        <li><a href="#" class="user" data-photo-url="${sessionScope.userPhotoUrl}"><span class="glyphicon glyphicon-user"></span> 个人中心</a></li>
        <li class="nav-divider"></li>
        <li><a href="#">&nbsp;</a></li>
      </ul>
    </div>
  </div>
</header>
</template>
<script>
export default {
  data () {
    return {
      clazz: 'active',
      menu: []
    }
  },
  created() {
     let $this = this;
     this.api.postMenu(null).then(data => {
       $this.menu = data;
     });

      // 导航菜单
      var $navbar = $(this.$el).find('.navbar ul.nav:not(.navbar-right) > li:has(a)');
      $navbar.click(function() {

          if ($(this).hasClass('active')) return;
          var navIdForShow = $(this).children('a').attr('href');
          var navIdForHide = "";
          $navbar.each(function() {
              if ($(this).hasClass('active')) {
                  navIdForHide = $(this).children('a').attr('href');
                  $(this).removeClass('active');
              }
          });
          $(this).addClass('active');
          $(navIdForHide).hide('normal', 'swing');
          $(navIdForShow).show('normal', 'linear');
      });
  },
  methods: {
      active: function () {
          this.clazz = 'active';
      }
  }
}
</script>