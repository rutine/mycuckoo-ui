<template>
  <div class="row">
    <div class="col-sm-12 col-md-12">
      <h3 class="page-header">系统参数管理</h3>
      <!-- 表单操作按钮 -->
      <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>

      <form name="editForm" method="post">
        <input type="hidden" name="paraId" v-model="formData.paraId"/>
        <table class="table table-bordered">
          <tr>
            <td width=14%><label>参数名称</label></td>
            <td><input type=text  name="paraName" v-model="formData.paraName" class="required" maxlength="20"/></td>
            <td width=14%><label>参数键名称</label></td>
            <td><input type=text name="paraKeyName" v-model="formData.paraKeyName" class="required" maxlength="20"
                       :readOnly="config.action == 'update'"/></td>
          </tr>
          <tr>
            <td width=14%><label>参数键值</label></td>
            <td><input type=text name="paraValue" v-model="formData.paraValue" class="required" /></td>
            <td width=14%><label>系统类别</label></td>
            <td>
              <select name="paraType" class="required" v-model="formData.paraType">
                <option v-for="item in dicSmallTypes" :value="item.smallTypeCode">{{ item.smallTypeName }}</option>
              </select>
            </td>
          </tr>
          <tr>
            <td width=14%><label>参数状态</label></td>
            <td>
              <select name="status" class="required" v-model="formData.status">
                <option value="enable">启用</option>
                <option value="disable">停用</option>
              </select>
            </td>
            <td width=14%><label>编码备注</label></td>
            <td><input type="text" name="memo" v-model="formData.memo" maxlength="50"/></td>
          </tr>
        </table>
      </form>
    </div>
  </div>
</template>
<script>
  export default {
    props: {
      config: Object
    },
    data () {
      if(this.config.id > -1) {
        this.api.systemParameterMgr.view(this.config).then(data => {
          this.formData = data;
        });
      }
      this.api.dictionaryMgr.getSmallType({bigTypeCode: 'systemType'}).then(data => {
        this.dicSmallTypes = data;
      });

      return {
        formData: {
          paraId: null,
          paraName: null,
          paraKeyName: null,
          paraValue: null,
          paraType: null,
          memo: null,
          creator: null,
          createDate: null
        },
        dicSmallTypes: []
      }
    },
    methods: {
      operator(fn) {
        eval('this.' + fn + '()');
      },
      create() {
        let $vue = this;
        this.api.systemParameterMgr.create(this.formData).then(data => {
          MyCuckoo.msg({state: 'success', title: '提示', msg: data});

          $vue.$emit('refresh');
          this.reback();
        });
      },
      update() {
        let $vue = this;
        this.api.systemParameterMgr.update(this.formData).then(data => {
          MyCuckoo.msg({state: 'success', title: '提示', msg: data});

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