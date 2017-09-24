<template>
<div class="row">
  <div class="col-sm-12 col-md-12" v-show="!config.view">
    <!-- 查询表单 -->
    <div class="page-header">
      <form class="form-inline" name="searchForm">
        <div class="form-group">
          <label class="sr-only">角色名称:&nbsp;</label>
          <input type="text" class="form-control input-sm" v-model="param.roleName" placeholder=角色名称 />
        </div>
        <button type="button" class="btn btn-info btn-sm" @click="list">&nbsp;查询
          <span class="glyphicon glyphicon-search"></span>
        </button>
        <button type="button" class="btn btn-default btn-sm" @click="clear">&nbsp;清空
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
        <th>角色名称</th>
        <th>角色级别</th>
        <th>角色状态</th>
        <th>创建人</th>
        <th>创建日期</th>
        <th>备注</th>
      </tr>
      <tr v-for="(item, index) in page.content">
        <td><input type="checkbox" name="single" v-model="selectData" :value="item"/></td>
        <td>{{ index + 1 }}</td>
        <td>{{ item.roleName }}</td>
        <td><selector name="number" :value="item.roleLevel"></selector></td>
        <td><selector name="status" :value="item.status"></selector></td>
        <td>{{ item.creator }}</td>
        <td>{{ item.createDate }}</td>
        <td>{{ item.memo }}</td>
      </tr>
    </table>

    <!-- 分页 -->
    <pagination :page="page" v-on:selectPage="selectPage"></pagination>
  </div>

  <component :is="config.view" :config="config" @refresh="list"></component>
</div>
</template>
<script>
import mgrForm from './roleMgrForm.vue';
import operationForm from './roleMgrAssignModOpt.vue';

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
        roleName: null,
        pageNo: 1,
        pageSize: 10
      },
      selectData: [],
      config: {}
    }
  },
  mounted() {
    this.list();
  },
  components: {
    mgrForm: mgrForm,
    operationForm: operationForm
  },
  methods: {
    //列表
    list() {
      let $vue = this;
      $vue.selectData = [];
      $vue.api.roleMgr.list($vue.param).then(data => {
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
        id: this.selectData[0].roleId
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0].roleId
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
          $vue.api.roleMgr.del({id: $vue.selectData[0].roleId}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: data.message});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
    //启用
    enable() {
      this.checkSelect();

      let $vue = this;
      let item = this.retrieve();
      if(item.status == 'enable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此角色已经启用' });
        return;
      }

      $vue.api.roleMgr.disEnable({id: item.roleId, disEnableFlag: 'enable'}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '角色启用成功'});

        $vue.list(); // 刷新列表
      });
    },
    //停用
    disable() {
      this.checkSelect();

      let $vue = this;
      let item = this.retrieve();
      if(item.status == 'disable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此角色已经停用' });
        return;
      }

      MyCuckoo.showDialog({
        msg : '您确认停用此角色? 如停用,相应机构下的此角色将自动清除.',
        okBtn: '是',
        cancelBtn: '否',
        ok : function() {
          $vue.api.roleMgr.disEnable({id: item.roleId, disEnableFlag: 'disable'}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: '角色停用成功'});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
    //分配权限
    optpri() {
      this.checkSelect();

      let item = this.retrieve();
      if (item.status == 'disable') {
        MyCuckoo.showMsg({ state : 'danger', title : '提示', msg : '请先启用此角色！' });
        return;
      }

      this.config = {
        view: 'operationForm',
        role: item
      }
    }
    //end
  }
}
</script>