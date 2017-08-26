<template>
<section>
<div v-for="(firstMenu, index) in menu.first" 
    :style="index == 0 ? 'display: block' : 'display: none'" 
    :id="firstMenu.moduleId + '_menu'">
  <ul class="nav nav-sidebar mycuckoo-sidenav">
    <li v-if="menu.commonFun.length">
      <a class="usedfuncmaint-hidden">常用功能</a>
      <ul class="nav" :style="'display: block'">
        <li v-for="commFun in menu.commonFun" @click="activeMenu">
           <!--{{ var url = '/menu/' + commFun.belongToSys + '/' + commFun.modEnId + '?&modPageType=' + commFun.modPageType; }}-->
          <router-link :to="'/menu/' + commFun.belongToSys + '/' + commFun.modEnId + '?&modPageType=' + commFun.modPageType" 
            :class="commFun.modImgCls + '-hidden'">{{ commFun.modName }}</router-link>
        </li>
      </ul>
    </li>
    
    <li v-for="(secondMenu, index2) in menu.second[firstMenu.moduleId]">
      <a :class="secondMenu.modImgCls + '-hidden'">{{ secondMenu.modName }}</a>
      
      <ul class="nav" :style="'display: block'">
          <li v-for="(thirdMenu, index3) in menu.third[secondMenu.moduleId]" @click="activeMenu">
            <router-link :to="'/menu/' + thirdMenu.belongToSys + '/' + thirdMenu.modEnId 
                  + '/index?&moduleId=' + thirdMenu.moduleId + '&modPageType=' + thirdMenu.modPageType" 
              :class="thirdMenu.modImgCls + '-hidden'">{{ thirdMenu.modName }}</router-link>
          </li>
      </ul>
    </li>
  </ul>
</div>
</section>
</template>
<script>
export default {
  data () {
    return {
      menu: {
        first: [],
        second: [],
        third: [],
        commonFun: []
      }
    }
  },
  created() {
     let $this = this;
     this.api.postMenu(null).then(data => {
         $this.menu = data;
     });
  },
  methods: {
    activeMenu: function(el) {//二级菜单
      let $this = $(el.target);
      $this.parents('li').siblings().removeClass('active')
          .find('li').removeClass('active');
      $this.addClass('active').parents('li').addClass('active');
    }
  }
}
</script>