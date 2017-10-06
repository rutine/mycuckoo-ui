<template>
  <div class="row">
    <div class="col-sm-12 col-md-12">
      <h3 class="page-header">设置新密码</h3>
      <form class="form-horizontal" name="editForm">
        <div class="form-group">
          <label class="col-sm-4 col-md-2 control-label">用户号:</label>
          <div class="col-sm-6 col-md-3">
            <p class="form-control-static">{{ userInfo.userCode }}</p>
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-4 col-md-2 control-label">用户名:</label>
          <div class="col-sm-6 col-md-3">
            <p class="form-control-static">{{ userInfo.userName }}</p>
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-4 col-md-2 control-label">密&nbsp;码:</label>
          <div class="col-sm-6 col-md-3">
            <input type="password" class="form-control" name="password" v-model="formData.password" />
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-4 col-md-2 control-label">新的密码:</label>
          <div class="col-sm-6 col-md-3">
            <input type="password" class="form-control" name="newPassword" v-model="formData.newPassword" />
          </div>
        </div>
        <div class="form-group">
          <label class="col-sm-4 col-md-2 control-label">确认密码:</label>
          <div class="col-sm-6 col-md-3">
            <input type="password" class="form-control" name="confirmPassword" v-model="formData.confirmPassword" />
          </div>
        </div>
        <div class="form-group">
          <div class="col-sm-4 col-md-2 col-sm-offset-4 col-md-offset-2">
            <button type="button" class="btn btn-primary" @click="saveNewPassword">确认</button>
          </div>
        </div>
      </form>
    </div>
  </div>
</template>
<script>
  export default {
    data() {
      return {
        formData: {
          password: null,
          newPassword: null,
          confirmPassword: null
        }
      }
    },
    methods: {
      //保存修改密码
      saveNewPassword() {
        console.log(this.formData.password)
        if(!this.formData.password) {
          MyCuckoo.showMsg({state: 'warning', title: '提示', msg: '密码不能为空'});
          return;
        }
        if(!this.formData.newPassword) {
          MyCuckoo.showMsg({state: 'warning', title: '提示', msg: '新的密码不能为空'});
          return;
        }
        if(!this.formData.confirmPassword) {
          MyCuckoo.showMsg({state: 'warning', title: '提示', msg: '确认密码不能为空'});
          return;
        }

        this.api.userMgr.updatePassword(this.formData).then(data => {
          MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});
        });
      }
    }
  }
</script>