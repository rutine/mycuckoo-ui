<template>
<!-- 模块操作按钮 -->
<div v-if="name == 'moduleOpt'" class="btn-toolbar">
  <div class="btn-group">
    <a v-for="operator in value" class="btn btn-default btn-sm"
       href="javascript:" @click="$emit('operator', operator.optFunLink)">
      <span :class="'glyphicon glyphicon' + operator.modImgCls"></span>{{ operator.modName }}
    </a>
  </div>
</div>

<!-- 表单操作按钮 -->
<div v-else-if="name == 'formOpt'" class="btn-toolbar">
  <div class="btn-group">
      <template v-if="value == 'create'">
      <a href="javascript:" @click="$emit('operator', 'create')"
         class="btn btn-default btn-sm" data-loading-text="执行中...">保存
        <span class="glyphicon glyphicon-hdd"></span>
      </a>
      <a href="javascript:" @click="$emit('operator', 'reback')"
         class="btn btn-default btn-sm" data-loading-text="执行中...">返回
        <span class="glyphicon glyphicon-circle-arrow-left"></span>
      </a>
      </template>
      <template v-else-if="value == 'update'">
      <a href="javascript:" @click="$emit('operator', 'update')"
         class="btn btn-default btn-sm" data-loading-text="执行中...">保存
        <span class="glyphicon glyphicon-hdd"></span>
      </a>
      <a href="javascript:" @click="$emit('operator', 'reback')"
         class="btn btn-default btn-sm" data-loading-text="执行中...">返回
        <span class="glyphicon glyphicon-circle-arrow-left"></span>
      </a>
      </template>
      <template v-else-if="value == 'view'">
      <a href="javascript:" @click="$emit('operator', 'reback')"
         class="btn btn-default btn-sm" data-loading-text="执行中...">返回
        <span class="glyphicon glyphicon-circle-arrow-left"></span>
      </a>
      </template>
      <template v-else="">
      <a href="javascript:" @click="$emit('operator', 'reback')"
         class="btn btn-default btn-sm" data-loading-text="执行中...">返回
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
      value: [String, Object, Array]
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