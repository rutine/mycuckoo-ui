<template>
<div>
<div v-for="(firstMenu, index) in menu.first" 
    :style="index == 0 ? 'display: block' : 'display: none'" 
    :id="firstMenu.moduleId + '_menu'">
  <ul class="nav nav-sidebar mycuckoo-sidenav">
    <li>
      <a class="usedfuncmaint-hidden">常用功能<span class="glyphicon glyphicon-chevron-up"></span></a>
      <ul class="nav">
        <li v-for="commFun in menu.commonFun">
        <!--   {{ var url = '/menu/' + commFun.belongToSys + '/' + commFun.modEnId + '?&modPageType=' + commFun.modPageType }} -->
          <router-link :to="'/menu/' + commFun.belongToSys + '/' + commFun.modEnId + '?&modPageType=' + commFun.modPageType" 
            :class="commFun.modImgCls + '-hidden'">{{ commFun.modName }}</router-link>
        </li>
      </ul>
    </li>
    
    <li v-for="(secondMenu, index2) in menu.second[firstMenu.moduleId]">
      <a :class="secondMenu.modImgCls + '-hidden'">{{ secondMenu.modName }}
        <span v-if="index2 == 0" class="glyphicon glyphicon-chevron-down"></span>
        <span v-else class="glyphicon glyphicon-chevron-left"></span>
      </a>
      
      <ul class="nav" :style="index2 == 0 ? 'display: block' : 'display: none'">
          <li v-for="(thirdMenu, index3) in menu.third[secondMenu.moduleId]">
            <router-link :to="'/menu/' + thirdMenu.belongToSys + '/' + thirdMenu.modEnId 
                  + '/index?&moduleId=' + thirdMenu.moduleId + '&modPageType=' + thirdMenu.modPageType" 
              :class="thirdMenu.modImgCls + '-hidden'">{{ thirdMenu.modName }}</router-link>
          </li>
          <!-- <li <c:if test="${sessionScope.modEnId eq thirdMenu.moduleId}">class="active"</c:if>>
            <a href="${url}" class="${thirdMenu.modImgCls}-hidden">${thirdMenu.modName}</a>
          </li> -->
      </ul>
    </li>
  </ul>
</div>
</div>
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
     this.api.postMenu(null, function(data) {
       $this.menu = data;
     });
  },
  methods:{
  
  }
}
</script>