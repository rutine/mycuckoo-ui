<template>
<div class="row">
  <div class="col-sm-12 col-md-12">
    <h3 class="page-header">角色管理</h3>

    <!-- 表单操作按钮 -->
    <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>

    <form name="editForm" action="editForm" method="post">
      <input type="hidden" name="roleId" v-model="role.roleId"/>
      <table class="table table-bordered">
        <tr>
          <td width=14%><label>角色名称</label></td>
          <td><input type=text  name="roleName" v-model="role.roleName" class="required" maxlength="10"/></td>
          <td width=14%><label>角色级别</label></td>
          <td>
            <select name="roleLevel" class="required" v-model="role.roleLevel">
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
          <td width=14%><label>角色状态</label></td>
          <td>
            <select name="status" class="required" v-model="role.status">
              <option value="enable">启用</option>
              <option value="disable">停用</option>
            </select>
          </td>
          <td width=14%><label>备注</label></td>
          <td><input type="text" name="memo" v-model="role.memo" maxlength="50"/></td>
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
      this.api.roleMgr.view(this.config).then(data => {
        this.role = data;
      });
    }
    return {
      role: {
        roleId: null,
        roleName: null,
        status: null,
        roleLevel: null,
        memo: null,
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
      this.api.roleMgr.create(this.role).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

        $vue.$emit('refresh');
        this.reback();
      });
    },
    update() {
      let $vue = this;
      this.api.roleMgr.update(this.role).then(data => {
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
