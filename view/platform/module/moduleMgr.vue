<template>
  <div class="row">
    <div v-show="!config.view">
    <div class="col-sm-3 col-md-2 mycuckoo-sidebar">
      <ul class="nav">
        <li style="font-size:13px">
          <strong>模块树</strong>
        </li>
        <li><ul id="tree_module" class="ztree"></ul></li>
      </ul>
    </div>

    <div class="col-sm-9 col-md-10 mycuckoo-submain">

      <!-- 查询表单 -->
      <div class="page-header">
        <form class="form-inline" name="searchForm">
          <div class="form-group">
            <label class="sr-only">模块名称</label>
            <input type="text" class="form-control input-sm" v-model="param.modName" placeholder=模块名称 />
          </div>
          <div class="form-group">
            <label class="sr-only">模块ID</label>
            <input type="text" class="form-control input-sm" v-model="param.modEnId" placeholder=模块ID />
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
          <th>模块名称</th>
          <th>模块ID</th>
          <th>模块图片样式</th>
          <th>模块级别</th>
          <th>模块顺序</th>
          <th>所属系统</th>
          <th>页面类型</th>
          <th>模块状态</th>
          <th class="hide">模块备注</th>
          <th>创建者</th>
          <th>创建日期</th>
          <th class="hide">上级模块</th>
        </tr>
        <tr v-for="(item, index) in page.content">
          <td><input type="checkbox" name="single" v-model="selectData" :value="item"/></td>
          <td>{{ index + 1 }}</td>
          <td>{{ item.modName }}</td>
          <td>{{ item.modEnId }}</td>
          <td>{{ item.modImgCls }}</td>
          <td><selector name="modLevel" :value="item.modLevel"></selector></td>
          <td>{{ item.modOrder }}</td>
          <td><selector name="systemType" :value="item.belongToSys"></selector></td>
          <td><selector name="modPageType" :value="item.modPageType"></selector></td>
          <td><selector name="status" :value="item.status"></selector></td>
          <td class="hide"></td>
          <td>{{ item.creator }}</td>
          <td>{{ item.createDate }}</td>
          <td class="hide"></td>
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
import mgrForm from './moduleMgrForm.vue';
import operationForm from './moduleMgrAssignOpts.vue';

export default {
  data() {
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
      config: {},
      zTree: null
    }
  },
  mounted() {
    let $vue = this;
    let setting = {
      check: {enable: false},
      data: {key: {name: 'text', icon: 'iconCls'}},
      view: {
        showLine: true,
        showIcon: false
      },
      callback: {
        onClick: function (event, treeId, treeNode) {
          $vue.param.treeId = treeNode.id;
          $vue.list();
        },
        beforeExpand: function (treeId, treeNode) {
          $vue.clear();
          !treeNode.loaded && $vue.api.moduleMgr.getChildNodes({treeId: treeNode.id}).then(data => {
            treeNode.loaded = true;
            $vue.zTree.addNodes(treeNode, data, true);
          });
        }
      }
    };

    $vue.api.moduleMgr.getChildNodes(null).then(data => {
      $vue.zTree = $.fn.zTree.init($('#tree_module'), setting, data);
    });

    $vue.list();
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
      $vue.api.moduleMgr.list($vue.param).then(data => {
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
        id: this.selectData[0].moduleId
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0].moduleId
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
          $vue.api.moduleMgr.del({id: $vue.selectData[0].moduleId}).then(data => {
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
      let module = this.retrieve();
      if(module.status == 'enable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此菜单已经启用' });
        return;
      }
      if (module.modLevel != 3) {
        MyCuckoo.showMsg({ state: 'warning', title : '提示', msg : '请您选择第三级菜单!' });
        return;
      }

      $vue.api.moduleMgr.disEnable({id: user.userId, disEnableFlag: 'enable'}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '菜单启用成功'});

        $vue.list(); // 刷新列表
      });
    },
    //停用
    disable() {
      this.checkSelect();

      let $vue = this;
      let module = this.retrieve();
      if(module.status == 'disable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此菜单已经停用' });
        return;
      }
      if (module.modLevel != 3) {
        MyCuckoo.showMsg({ state: 'warning', title : '提示', msg : '请您选择第三级菜单!' });
        return;
      }

      MyCuckoo.showDialog({
        msg : '您确认停用此菜单吗?如果停用,此菜单下的操作将自动清除,并重登生效.',
        okBtn: '是',
        cancelBtn: '否',
        ok : function() {
          $vue.api.moduleMgr.disEnable({id: user.userId, disEnableFlag: 'disable'}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: '菜单启用成功'});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
    //分配菜单操作
    optassign() {
      this.checkSelect();

      let module = this.retrieve();
      if(module.modLevel != 3) {
        MyCuckoo.showMsg({state: 'info', title: '提示', msg: '请您选择第三级模块菜单'});
        return;
      }

      this.config = {
        view: 'operationForm',
        module: module
      }
    },
    //
    optpri() {

    },
    //
    moduleLabel() {
      alert('开发中....');
    }

  }
}
</script>