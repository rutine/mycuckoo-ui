<template>
<div>
  <h3 class="page-header">类别字典管理</h3>
  <!-- 表单操作按钮 -->
  <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>

  <form class="form-inline" name="editForm" action="editForm" method="post">
    <input type="hidden" name="bigTypeId" v-model="formData.bigTypeId"/>
    <div class="jumbotron" style="margin-bottom:10px; padding:15px; font-size:12px;">
      <p v-if="config.action == 'view'"><strong  class="text-info">类别字典大类</strong></p>
      <p v-else=""><strong  class="text-info">类别字典大类添加</strong></p>
      <table class="table table-bordered">
        <tr>
          <td width=14%><label>字典大类名称</label></td>
          <td><input type=text  name="bigTypeName" v-model="formData.bigTypeName" class="required" maxlength="20"/></td>
          <td width=14%><label>字典大类代码</label></td>
          <td><input type=text name="bigTypeCode" v-model="formData.bigTypeCode" class="required alphanumeric" maxlength="15"/></td>
        </tr>
        <tr>
          <td width=14%><label>字典状态</label></td>
          <td>
            <select name="status" class="required" v-model="formData.status">
              <option value="enable">启用</option>
              <option value="disable">停用</option>
            </select>
          </td>
          <td width=14%><label>备注</label></td>
          <td><input type="text" name="memo" v-model="formData.memo" maxlength="50"/></td>
        </tr>
      </table>
    </div>
    <div class="jumbotron" style="margin-bottom:10px; padding:15px; font-size:12px;">
      <p v-if="config.action == 'view'"><strong  class="text-info">类别字典小类</strong></p>
      <div v-else="">
        <p><strong  class="text-info">类别字典小类添加</strong></p>
        <span class="btn btn-info btn-xs add" @click="addSmallType"><span class="glyphicon glyphicon-plus"></span></span>
      </div>
      <table class="table table-condensed">
        <tr v-for="(smallType, index) in formData.smallTypes">
          <td width=14%><label>字典小类名称</label></td>
          <td><input type="text" :name="'smallTypes[' + index + '].smallTypeName'"
                     v-model="smallType.smallTypeName" class="required" maxlength="20" /></td>
          <td width=14%><label>字典小类代码</label></td>
          <td><input type="text" :name="'smallTypes[' + index + '].smallTypeCode'"
                     v-model="smallType.smallTypeCode" class="required alphanumeric" maxlength="10" /></td>
          <td v-show="config.action != 'view'">
            <span class="btn btn-danger btn-xs delete">
              <span class="glyphicon glyphicon-remove" @click="delSmallType(smallType)"></span>
            </span>
          </td>
        </tr>
      </table>
    </div>
  </form>
</div>
</template>
<script>
export default {
  props: {
    config: Object
  },
  data() {
    if (this.config.id > -1) {
      this.api.dictionaryMgr.view(this.config).then(data => {
        this.formData = data;
      });
    }
    return {
      formData: {
        bigTypeId: null,
        bigTypeCode: null,
        bigTypeName: null,
        memo: null,
        creator: null,
        createDate: null,
        smallTypes: []
      }
    }
  },
  methods: {
    //添加字典小类
    addSmallType() {
      this.formData.smallTypes.push({smallTypeCode: '', smallTypeName: ''});
    },
    //删除字典小类
    delSmallType(smallType) {
      this.formData.smallTypes.forEach((item, index) => {
        if(item == smallType) {
          this.formData.smallTypes.splice(index, 1);
        }
      });
    },
    operator(fn) {
      eval('this.' + fn + '()');
    },
    create() {
      let $vue = this;
      this.api.dictionaryMgr.create(this.formData).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

        $vue.$emit('refresh');
        this.reback();
      });
    },
    update() {
      let $vue = this;
      this.api.dictionaryMgr.update(this.formData).then(data => {
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