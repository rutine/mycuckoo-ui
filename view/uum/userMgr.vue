<template>
  <div class="row">
    <div v-show="!config.view">
    <div class="col-sm-3 col-md-2 mycuckoo-sidebar">
      <ul class="nav">
        <li style="font-size:13px">
          <strong>机构角色树</strong>
        </li>
        <li><ul id="tree_user" class="ztree"></ul></li>
      </ul>
    </div>
    
    <div class="col-sm-9 col-md-10 mycuckoo-submain">

      <!-- 查询表单 -->
      <div class="page-header">
        <form class="form-inline" name="searchForm">
          <div class="form-group">
            <label class="sr-only">用户号</label>
            <input type="text" class="form-control input-sm" v-model="param.userCode" placeholder=用户号 />
          </div>
          <div class="form-group">
            <label class="sr-only">用户名</label>
            <input type="text" class="form-control input-sm" v-model="param.userName" placeholder=用户名 />
          </div>
          <button type="button" class="btn btn-info btn-sm" name="search" @click="list">查询
            <span class="glyphicon glyphicon-search"></span>
          </button>
          <button type="button" class="btn btn-default btn-sm" name="clear" @click="clear">&nbsp;清空
            <span class="glyphicon glyphicon-repeat"></span>
          </button>
        </form>
      </div>

      <!-- 模块操作按钮 -->
      <toolbar name="moduleOpt" :value="menu.fourth[$route.params.moduleId]" v-on:operator="operator"></toolbar>

      <!-- 内容列表 -->
      <table class="table table-striped table-hover table-condensed">
        <tr>
          <th><input type="checkbox" name="all" @click="selectAll"/></th>
          <th>序号</th>
          <th>用户号</th>
          <th>用户名</th>
          <th class="hidden">密码</th>
          <th>性别</th>
          <th>职位</th>
          <th class="hidden">用户照片(单击照片删除)</th>
          <th class="hidden">选择照片</th>
          <th>用户QQ</th>
          <th class="hidden">用户MSN</th>
          <th>用户手机</th>
          <th class="hidden">用户手机2</th>
          <th class="hidden">办公电话</th>
          <th class="hidden">家庭电话</th>
          <th class="hidden">家庭住址</th>
          <th>用户邮件</th>
          <th class="hidden">用户有效期</th>
          <th>所属机构</th>
          <th>所属角色</th>
          <th>用户状态</th>
          <th class="hidden">备注</th>
          <th>创建人</th>
          <th>创建日期</th>
        </tr>
        <tr v-for="(item, index) in page.content">
          <td><input type="checkbox" name="single" v-model="selectData" :value="item"/></td>
          <td>{{ index + 1 }}</td>
          <td>{{ item.userCode }}</td>
          <td>{{ item.userName }}</td>
          <td class="hidden"></td>
          <td><selector name="gender" :value="item.userGender"></selector></td>
          <td>{{ item.userPosition }}</td>
          <td class="hidden"></td>
          <td class="hidden"></td>
          <td>{{ item.userQq }}</td>
          <td class="hidden"></td>
          <td>{{ item.userMobile }}</td>
          <td class="hidden"></td>
          <td class="hidden"></td>
          <td class="hidden"></td>
          <td class="hidden"></td>
          <td>{{ item.userEmail }}</td>
          <td class="hidden"></td>
          <td>{{ item.orgName }}</td>
          <td>{{ item.roleName }}</td>
          <td><selector name="status" :value="item.status"></selector></td>
          <td class="hidden"></td>
          <td>{{ item.creator }}</td>
          <td>{{ item.createDate }}</td>
        </tr>
      </table>

      <!-- 分页 -->
      <pagination :page="page" v-on:selectPage="selectPage"></pagination>
    </div>
    </div>

    <component :is="config.view" :config="config" @refresh="list"></component>
  </div>
</template>
<script>
import mgrForm from './userMgrForm.vue';
import roleForm from './userMgrAssignRole.vue';
import operationForm from './userMgrAssignModOpt.vue';

export default {
  data () {
    return {
      page: {
        number: 1,
        size: 10,
        totalPages: 0,
        firstPage: true,
        lastPage: false,
        content: []
      },
      param: {
        treeId: null,
        userCode: null,
        userName: null,
        pageNo: 1,
        pageSize: 10
      },
      selectData: [],
      config: {}
    }
  },
  mounted() {
    let $vue = this;
    let setting = {
      check : { enable : false},
      data : { key : { name : 'text', icon : 'iconCls' } },
      view : {
        showLine : true,
        showIcon : false
      },
      callback : {
        onClick : function(event, treeId, treeNode) {
          $vue.param.treeId = treeNode.id;
          $vue.list();
        },
        beforeExpand : function(treeId, treeNode) {
          !treeNode.loaded && $vue.api.userMgr.getChildNodes({ treeId: treeNode.id }).then(data => {
            treeNode.loaded = true;
            zTree.addNodes(treeNode, data, true);
          });
        }
      }
    };

    let zTree = null;
    $vue.api.userMgr.getChildNodes(null).then(data => {
      zTree = $.fn.zTree.init($('#tree_user'), setting, data);
    });

    $vue.list();
  },
  components: {
    mgrForm: mgrForm,
    roleForm: roleForm,
    operationForm: operationForm
  },
  methods: {
    //列表
    list() {
      let $vue = this;
      $vue.selectData = [];
      $vue.api.userMgr.list($vue.param).then(data => {
        $vue.page = data;
      });
    },
    //清理查询
    clear() {
      for(let p in this.param) {
        this.param[p] = '';
      }
    },
    //分页
    selectPage(pageNo) {
      this.param.pageNo = pageNo;
      this.list();
    },
    selectAll(e) {
      let $vue = this;
      if (!e.currentTarget.checked) {
        $vue.selectData = [];
      } else {
        $vue.selectData = [];
        $vue.page.content.forEach(function(item, i) {
          $vue.selectData.push(item);
        });
      }
    },
    //检查选中
    checkSelect() {
      if(this.selectData.length != 1) {
        MyCuckoo.showMsg({state: 'warning', title: '提示', msg: '请选择一条件记录!'});
        throw new Error('请选择一条件记录');
      }
    },
    //查找选中
    retrieve() {
      return this.selectData[0];
    },
    //操作
    operator(fn) {
      eval('this.' + fn + '()');
    },


    //增加
    add() {
      this.config = {
        view: 'mgrForm',
        action: 'create'
      }
    },
    //修改
    modify() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'update',
        id: this.selectData[0].userId
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0].userId
      }
    },
    //删除
    delete() {
      this.checkSelect();

      let $vue = this;
      MyCuckoo.showDialog({
        title: '警告提示',
        msg: '您确认删除此记录吗?',
        okBtn: '是',
        cancelBtn: '否',
        ok: function() {
          $vue.api.userMgr.del({id: $vue.selectData[0].userId}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
    //启用
    enable() {
      this.checkSelect();

      let $vue = this;
      let user = this.retrieve();
      if(user.status == 'enable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此用户已经启用' });
        return;
      }

      $vue.api.userMgr.disEnable({id: user.userId, disEnableFlag: 'enable'}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '用户启用成功'});

        $vue.list(); // 刷新列表
      });
    },
    //停用
    disable() {
      this.checkSelect();

      let $vue = this;
      let user = this.retrieve();
      if(user.status == 'disable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此用户已经停用' });
        return;
      }

      MyCuckoo.showDialog({
        msg : '您确认停用此用户?如停用,此用户将归入无角色用户并自动清除所有权限.',
        okBtn: '是',
        cancelBtn: '否',
        ok : function() {
          $vue.api.userMgr.disEnable({id: user.userId, disEnableFlag: 'disable'}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: '用户停用成功!此用户将不能在使用本系统'});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
    //重置密码
    resetpwd() {
      this.checkSelect();

      let $vue = this;
      let user = this.retrieve();
      $vue.api.userMgr.resetPwd({id: user.userId, userName: user.userName}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

        $vue.list(); // 刷新列表
      });
    },
    //分配角色
    assignrole() {
      this.checkSelect();

      let user = this.retrieve();
      if(user.status == 'disable') {
        MyCuckoo.showMsg({state: 'info', title: '提示', msg: '请先启用此用户'});
        return;
      }

      this.config = {
        view: 'roleForm',
        user: user
      }
    },
    //分配权限
    optpri() {
      this.checkSelect();

      let user = this.retrieve();
      if (user.status == 'disable') {
        MyCuckoo.showMsg({ state : 'danger', title : '提示', msg : '请先启用此用户！' });
        return;
      } else if(user.orgRoleId == 0) {
        MyCuckoo.showMsg({ state : 'danger', title : '提示', msg : '请先为此用户分配有效角色！' });
        return;
      }

      this.config = {
        view: 'operationForm',
        user: user
      }
    }
    //end

  }
}
</script>