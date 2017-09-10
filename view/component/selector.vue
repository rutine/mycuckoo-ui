<template>
  <div v-if="name == 'status'">
    <span v-if="value == 'enable'">启用</span>
    <span v-else-if="value == 'disable'">停用</span>
  </div>

  <div v-else-if="name == 'systemType'">
    <span v-if="value == 'platform'">系统平台</span>
    <span v-else-if="value == 'uum'">统一用户</span>
  </div>

  <div v-else-if="name == 'modPageType'">
    <span v-if="value == 'js'">js</span>
    <span v-else-if="value == 'jsp'">jsp</span>
    <span v-else-if="value == 'html'">html</span>
    <span v-else-if="value == 'flex'">flex</span>
  </div>

  <div v-else-if="name == 'modLevel'">
    <span v-if="value == '1'">第一</span>
    <span v-else-if="value == '2'">第二</span>
    <span v-else-if="value == '3'">第三</span>
  </div>

  <div v-else-if="name == 'funArea'">
    <span v-if="value == 'header'">页面头部</span>
    <span v-else-if="value == 'navigate'">页面导航菜单</span>
    <span v-else-if="value == 'outlookBar'">页面左侧菜单</span>
    <span v-else-if="value == 'mainPage'">主页面</span>
    <span v-else-if="value == 'stateBar'">页面状态栏</span>
  </div>

  <div v-else-if="name == 'pageStyle'">
    <span v-if="value == 'general'">general</span>
    <span v-else-if="value == 'winxp'">winxp</span>
  </div>

  <div v-else-if="name == 'number'">
    <span v-if="value == '1'">1</span>
    <span v-else-if="value == '2'">2</span>
    <span v-else-if="value == '3'">3</span>
    <span v-else-if="value == '4'">4</span>
    <span v-else-if="value == '5'">5</span>
    <span v-else-if="value == '6'">6</span>
    <span v-else-if="value == '7'">7</span>
    <span v-else-if="value == '8'">8</span>
    <span v-else-if="value == '9'">9</span>
  </div>

  <!-- 性别 -->
  <div v-else-if="name == 'gender'">
    <span v-if="value == '0'">男</span>
    <span v-else-if="value == '1'">女</span>
  </div>

  <!-- 日志 -->
  <div v-else-if="name == 'logSaveTime'">
    <span v-if="value == '-1'">不设置</span>
    <span v-else-if="value == '3'">3天</span>
    <span v-else-if="value == '7'">7天</span>
    <span v-else-if="value == '15'">15天</span>
    <span v-else-if="value == '30'">30天</span>
    <span v-else-if="value == '60'">60天</span>
    <span v-else-if="value == '90'">90天</span>
    <span v-else-if="value == '180'">180天</span>
    <span v-else-if="value == '360'">360天</span>
  </div>

  <!-- 编码段数 -->
  <div v-else-if="name == 'partNum'">
    <select v-model="value" name="partNum" class="required">
      <option value="1">1</option>
      <option value="2">2</option>
      <option value="3">3</option>
      <option value="4">4</option>
    </select>
  </div>

  <!-- 分隔符 -->
  <div v-else-if="name == 'delimite'">
    <select v-model="value" name="delimite" class="required">
      <option value="-">-</option>
      <option value="_">_</option>
      <option value=":">:</option>
      <option value="/">/</option>
      <option value="|">|</option>
    </select>
  </div>

  <!-- 编码格式 -->
  <div v-else-if="name == 'codeFormat'">
    <select v-model="value" :name="field" :disabled="disabled">
      <option value="char">字符</option>
      <option value="date">日期</option>
      <option value="number">序号</option>
      <option value="sysPara">系统参数</option>
    </select>
  </div>

  <!-- 编码-日期格式 -->
  <div v-else-if="name == 'dateFormat'">
    <select v-model="value" :name="field" :disabled="disabled">
      <option value="yyyy">年(yyyy)</option>
      <option value="yyyyMM">年月(yyyyMM)</option>
      <option value="yyyyMMdd">年月日(yyyyMMdd)</option>
    </select>
  </div>

  <!-- 编码-序号格式 -->
  <div v-else-if="name == 'dateFormat'">
    <select v-model="value" :name="field" :disabled="disabled">
      <option value="01">两位(01)</option>
      <option value="001">三位(001)</option>
      <option value="0001">四位(0001)</option>
      <option value="00001">五位(00001)</option>
      <option value="000001">六位(000001)</option>
    </select>
  </div>

  <!-- 编码-序号格式 -->
  <div v-else-if="name == 'sysParaFormat'">
    <select v-model="value" :name="field" :disabled="disabled">
      <option value="userName">用户名</option>
      <option value="roleUser">角色+用户名</option>
      <option value="organRoleUser">机构+角色+用户名</option>
    </select>
  </div>
</template>
<script>
  export default {
    props: {
      name: String,
      value: [String, Number],
      field: String,
      disabled: String
    },
    data () {
      return {

      }
    },
    created() {

    },
    methods: {

    }
  }
</script>