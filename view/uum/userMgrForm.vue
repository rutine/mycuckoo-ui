<template>
<div>
  <!-- 表单操作按钮 -->
  <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>

  <form class="form-inline" name="editForm" action="">
    <input type="hidden" name="userId" v-model="user.userId"/>
    <table class="table table-bordered">
      <tr>
        <td width=14%><label>用户号</label></td>
        <td><input type=text  name="userCode" v-model="user.userCode" class="required alphanumeric" maxlength="10"/></td>
        <td width=14% rowspan="3"><label>用户照片</label></td>
        <td rowspan="3">
          <img v-if="!user.userPhotoUrl" src="/public/static/images/form/blank_userphoto.gif" class="img-circle" />
          <img v-else="" :src="'/public' + user.userPhotoUrl"/>
          <span class="btn btn-success btn-sm">
            <span class="glyphicon glyphicon-plus"></span>
            <span>照片</span>
            <input type="file" name="userPhoto" >
          </span>
        </td>
      </tr>
      <tr>
        <td width=14%><label>用户名</label></td>
        <td><input type=text name="userName" v-model="user.userName" maxlength="60"/></td>
      </tr>
      <tr>
        <td width=14%><label>密码</label></td>
        <td><input type=password name="userPassword" v-model="user.userPassword" class="alphanumeric" maxlength="20"/></td>
      </tr>
      <tr>
        <td width=14%><label>性别</label></td>
        <td>
          <input type="radio" name="userGender" value="0" v-model="user.userGender"> 男
          <input type="radio" name="userGender" value="1" v-model="user.userGender"> 女
        </td>
        <td width=14%><label>职位</label></td>
        <td><input type=text name="userPosition" v-model="user.userPosition" maxlength="20"/></td>
      </tr>
      <tr>
        <td width=14%><label>用户QQ</label></td>
        <td><input type=text name="userQq" v-model="user.userQq" class="digits" maxlength="20"/></td>
        <td width=14%><label>用户MSN</label></td>
        <td><input type=text name="userMsn" v-model="user.userMsn" class="email" maxlength="30"/></td>
      </tr>
      <tr>
        <td width=14%><label>用户手机</label></td>
        <td><input type=text name="userMobile" v-model="user.userMobile" class="digits" maxlength="20"/></td>
        <td width=14%><label>用户手机2</label></td>
        <td><input type=text name=userMobile2 v-model="user.userMobile2" class="digits" maxlength="20"/></td>
      </tr>
      <tr>
        <td width=14%><label>办公电话</label></td>
        <td><input type=text name="userOfficeTel" v-model="user.userOfficeTel" class="digits" maxlength="20"/></td>
        <td width=14%><label>家庭电话</label></td>
        <td><input type=text name=userFamilyTel v-model="user.userFamilyTel" class="digits" maxlength="20"/></td>
      </tr>
      <tr>
        <td width=14%><label>家庭住址</label></td>
        <td><input type=text name="userAddress" v-model="user.userAddress"  maxlength="100"/></td>
        <td width=14%><label>用户邮件</label></td>
        <td><input type=text name=userEmail v-model="user.userEmail" class="email" maxlength="30"/></td>
      </tr>
      <tr>
        <td width=14%><label>用户有效期</label></td>
        <td>
          <div id="user_avidate" class="input-group date">
            <input type="text" class="form-control required" name="userAvidate" v-model="user.userAvidate" readOnly />
            <span class="input-group-addon"><span class="glyphicon glyphicon-remove"></span></span> 
            <span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>
          </div>
        </td>
        <td width=14%><label>所属角色</label></td>
        <td>
          <input type="hidden" name="belongOrganId" v-model="user.belongOrganId" /> <!-- 机构ID -->
          <input type="hidden" name="orgRoleId" v-model="user.orgRoleId" /> <!-- 机构角色ID -->
          <input type="text" name="roleName" v-model="user.roleName" class="required" />
          <span class="btn btn-warning btn-sm select"><span class="glyphicon glyphicon-search"></span></span>
        </td>
      </tr>
      <tr>
        <td width=14%><label>备注</label></td>
        <td><input type="text" name="memo" v-model="user.memo" maxlength="50"/></td>
        <td></td>
        <td></td>
      </tr>
    </table>
  </form>
</div>
</template>
<script>
  export default {
    props: {
      config: Object
    },
    data () {
      console.log(this.config);
      if(this.config.id) {
        this.api.userMgr.view(this.config).then(data => {
          this.user = data;
        });
      }
      return {
        user: {
          userCode: null,
          userName: null,
          userPhotoUrl: null,
          userPassword: null,
          userGender: null,
          userPosition: null,
          userQq: null,
          userMsn: null,
          userMobile: null,
          userMobile2: null,
          userOfficeTel: null,
          userFamilyTel: null,
          userAddress: null,
          userEmail: null,
          userAvidate: null,
          belongOrganId: null,
          orgRoleId: null,
          roleName: null,
          memo: null
        }
      }
    },
    mounted() {
      let $vue = this;

      // 用户有效期
      let $html = $(this.$el);
      $html.find('#user_avidate').datetimepicker({
        language : 'zh-CN',
        format : 'yyyy-mm-dd',
        autoclose : 1,
        todayHighlight: 1,
        todayBtn : 'linked',
        startView : 2,
        minView : 2,
        forceParse : 0
      });

      // 选择角色
      $html.on('click', 'input[name=roleName], .btn.select', function() {
        var $this = $(this);
        let setting = {
          check : { enable : false},
          callback : {
            onClick : function(evane, treeId, treeNode) {
              var _flag = treeNode.id.indexOf('_');
              if(treeNode.id.substr(_flag + 1) == '1' || treeNode.id == '0') return;
              var id = treeNode.id.substr(0, _flag);
              var name = treeNode.getParentNode() ? (treeNode.getParentNode().text + '-' + treeNode.text) : treeNode.text;
              $this.siblings('input:hidden').val(id);
              $this.hasClass('btn') ? $this.siblings('input:not(:hidden)').val(name) : $this.val(name);
              $modal.modal('hide');
            },
            beforeExpand : function(treeId, treeNode) {
              !treeNode.loaded && $vue.api.userMgr.getChildNodes({ treeId: treeNode.id }).then(data => {
                treeNode.loaded = true;
                zTree.addNodes(treeNode, data, true);
              });
            }
          },
          data : { key : { name : 'text', icon : 'iconCls' } },
          view : {
            showLine : true,
            showIcon : false
          }
        }
        var $modal = $(MyCuckoo.modalTemplate);
        $modal.on('hidden.bs.modal', function() { $(this).off().find('.btn').off().end().remove(); });
        $modal.find('.modal-dialog').addClass('modal-sm');
        $modal.find('h3').text('选择角色');
        $modal.find('.modal-body').append(
            '<ul class="nav nav-list">' +
            '   <li style="font-size:13px">' +
            '     <strong>机构角色树</strong>' +
            '   </li>' +
            '   <li><ul class="ztree"></ul></li>' +
            '</ul>');
        $modal.find('.modal-footer .btn:first').remove();
        $modal.modal();
        $modal.appendTo($('body'));

        let zTree = null;
        $vue.api.userMgr.getChildNodes(null).then(data => {
          zTree = $.fn.zTree.init($modal.find('.modal-body .ztree'), setting, data);
        });
      });

    },
    created() {

    },
    methods: {
      operator(fn) {
        eval('this.' + fn + '()');
      },
      saveadd() {
        this.api.userMgr.create(this.user).then(data => {
          MyCuckoo.showMsg({state: 'success', title: '提示', msg: data.message});
        });
      },
      save() {

      },
      reback() {
        this.config.view = '';
      }
    }
  }
</script>