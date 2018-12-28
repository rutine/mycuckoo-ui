<template>
  <div class="row">
    <div class="col-sm-12 col-md-12">
      <h3 class="page-header">操作按钮管理</h3>

      <!-- 表单操作按钮 -->
      <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>

      <form name="editForm" action="editForm" method="post">
        <input type="hidden" name="operateId" v-model="formData.operateId" />
        <table class="table table-bordered">
          <tr>
            <td width=14%><label>操作名称</label></td>
            <td><input type=text  name="operateName" v-model="formData.operateName" class="required" maxlength="10"/></td>
            <td width=14%><label>图片链接</label></td>
            <td><input type=text name="optImgLink" v-model="formData.optImgLink" class="required alphanumeric" maxlength="20"/></td>
          </tr>
          <tr>
            <td width=14%><label>功能链接</label></td>
            <td><input type=text name="optFunLink" v-model="formData.optFunLink" class="required alphanumeric" maxlength="20"/></td>
            <td width=14%><label>操作顺序</label></td>
            <td>
              <select name="optOrder" v-model="formData.optOrder" class="required">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
              </select>
            </td>
          </tr>
          <tr>
            <td width=14%><label>操作组</label></td>
            <td>
              <select name="optGroup" v-model="formData.optGroup" class="required">
                <option value="1">1</option>
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
                <option value="6">6</option>
                <option value="7">7</option>
                <option value="8">8</option>
                <option value="9">9</option>
              </select>
            </td>
            <td width=14%><label>模块状态</label></td>
            <td>
              <select name="status" v-model="formData.status" class="required">
                <option value="enable">启用</option>
                <option value="disable">停用</option>
              </select>
            </td>
          </tr>
          <tr>
            <td width=14%><label>备注</label></td>
            <td><input type="text" name="memo" v-model="formData.memo" maxlength="50"/></td>
            <td width=14%></td>
            <td></td>
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
    if(this.config.id) {
      this.api.operateMgr.view(this.config).then(data => {
        this.formData = data;
      });
    }

    return {
      formData: {
        operateId: null,
        operateName: null,
        optImgLink: null,
        optFunLink: null,
        optOrder: null,
        optGroup: null,
        memo: null,
        status: null,
        creator: null,
        createDate: null
      }
    }
  },
  methods: {
    operator(fn) {
      eval('this.' + fn + '()');
    },
    create() {
      let $vue = this;
      this.api.operateMgr.create(this.formData).then(data => {
        MyCuckoo.msg({state: 'success', title: '提示', msg: data});

        $vue.$emit('refresh');
        this.reback();
      });
    },
    update() {
      let $vue = this;
      this.api.operateMgr.update(this.formData).then(data => {
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