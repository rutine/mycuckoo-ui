<template>
<section>
<div v-for="(first, index) in menu.first"
    :style="index == 0 ? 'display: block' : 'display: none'" 
    :id="first.moduleId + '_menu'">
  <ul class="nav nav-sidebar mycuckoo-sidenav">
    <li v-if="menu.commonFun.length">
      <a class="usedfuncmaint-hidden">常用功能</a>
      <ul class="nav" :style="'display: block'">
        <li v-for="commFun in menu.commonFun" @click="activeMenu">
          <router-link
                  :to="'/' + commFun.belongToSys + '/' + commFun.modEnId"
                  :class="commFun.modImgCls + '-hidden'">{{ commFun.modName }}</router-link>
        </li>
      </ul>
    </li>
    
    <li v-for="(second, index2) in menu.second[first.moduleId]">
      <a :class="second.modImgCls + '-hidden'">{{ second.modName }}</a>
      
      <ul class="nav" :style="'display: block'">
          <li v-for="(third, index3) in menu.third[second.moduleId]" @click="activeMenu">
            <router-link
                    :to="'/' + third.belongToSys + '/' + third.modEnId + '/' + third.moduleId"
                    :class="third.modImgCls + '-hidden'">{{ third.modName }}</router-link>
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

    }
  },
  created() {

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