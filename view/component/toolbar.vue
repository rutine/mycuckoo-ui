<template>
<!-- 模块操作按钮 -->
<div v-if="name == 'moduleOpt'" class="btn-toolbar">
  <div class="btn-group">
    <a v-for="modOpt in value" class="btn btn-default btn-sm" :href="'#' + modOpt.optFunLink">
      <span :class="'glyphicon glyphicon' + modOpt.modImgCls"></span>{{ modOpt.modName }}
    </a>
  </div>
</div>

<!-- 表单操作按钮 -->
<div v-else-if="name == 'formOpt'" class="btn-toolbar">
  <div class="btn-group">
      <template v-if="value == 'create'">
      <a href="#save" class="btn btn-default btn-sm" data-loading-text="执行中...">保存
        <span class="glyphicon glyphicon-hdd"></span>
      </a>
      <a href="#saveadd" class="btn btn-default btn-sm" data-loading-text="执行中...">保存增加
        <span class="glyphicon glyphicon-plus-sign"></span>
      </a>
      <a href="#reback" class="btn btn-default btn-sm" data-loading-text="执行中...">返回
        <span class="glyphicon glyphicon-circle-arrow-left"></span>
      </a>
      </template>
      <template v-else-if="value == 'update'">
      <a href="#save" class="btn btn-default btn-sm" data-loading-text="执行中...">保存
        <span class="glyphicon glyphicon-hdd"></span>
      </a>
      <a href="#reback" class="btn btn-default btn-sm" data-loading-text="执行中...">返回
        <span class="glyphicon glyphicon-circle-arrow-left"></span>
      </a>
      </template>
      <template v-else-if="value == 'view'">
      <a href="#reback" class="btn btn-default btn-sm" data-loading-text="执行中...">返回
        <span class="glyphicon glyphicon-circle-arrow-left"></span>
      </a>
      </template>
      <template v-else="">
      <a href="#reback" class="btn btn-default btn-sm" data-loading-text="执行中...">返回
        <span class="glyphicon glyphicon-circle-arrow-left"></span>
      </a>
      </template>
  </div>
</div>
</template>
<script>
  export default {
    props: {
      name: String,
      value: [Object, Array]
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