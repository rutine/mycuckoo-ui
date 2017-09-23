<template>
  <div class="row">
    <div v-show="!config.view">
    <div class="col-sm-3 col-md-2 mycuckoo-sidebar">
      <ul class="nav">
        <li style="font-size:13px">
          <strong>地区树</strong>
        </li>
        <li><ul id="tree_district" class="ztree"></ul></li>
      </ul>
    </div>

    <div class="col-sm-9 col-md-10 mycuckoo-submain">
      <!-- 查询表单 -->
      <div class="page-header">
        <form class="form-inline" name="searchForm">
          <div class="form-group">
            <label class="sr-only">地区名称</label>
            <input type="text" class="form-control input-sm" v-model="param.districtName" placeholder=地区名称 />
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
          <th>地区名称</th>
          <th>地区代码</th>
          <th>地区邮编</th>
          <th>电话区号</th>
          <th>地区级别</th>
          <th>地区状态</th>
          <th class="hide">模块备注</th>
          <th>创建者</th>
          <th>创建日期</th>
          <th class="hide">上级地区</th>
        </tr>
        <tr v-for="(item, index) in page.content">
          <td><input type="checkbox" name="single" v-model="selectData" :value="item" /></td>
          <td>{{ index + 1 }}</td>
          <td>{{ item.districtName }}</td>
          <td>{{ item.districtCode }}</td>
          <td>{{ item.districtPostal }}</td>
          <td>{{ item.districtTelcode }}</td>
          <td>{{ item.districtLevel }}</td>
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
import mgrForm from './districtMgrForm.vue';
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
        districtName: null,
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
      check: {enable: false},
      data: {key: {name: 'text', icon: 'iconCls'}},
      view: {
        showLine: true,
        showIcon: false
      },
      callback: {
        onClick: function (event, treeId, treeNode) {
          $vue.clear();
          $vue.param.treeId = treeNode.id;
          $vue.list();
        },
        beforeExpand: function (treeId, treeNode) {
          !treeNode.loaded && $vue.api.districtMgr.getChildNodes({treeId: treeNode.id}).then(data => {
            treeNode.loaded = true;
            zTree.addNodes(treeNode, data, true);
          });
        }
      }
    };

    let zTree = null;
    $vue.api.districtMgr.getChildNodes(null).then(data => {
      zTree = $.fn.zTree.init($('#tree_district'), setting, data);
    });

    $vue.list();
  },
  components: {
    mgrForm: mgrForm
  },
  methods: {
    //列表
    list() {
      let $vue = this;
      $vue.selectData = [];
      $vue.api.districtMgr.list($vue.param).then(data => {
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
        id: this.selectData[0].districtId
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0].districtId
      }
    },
    //启用
    enable() {
      this.checkSelect();

      let $vue = this;
      let user = this.retrieve();
      if(user.status == 'enable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此地区已经启用' });
        return;
      }

      $vue.api.userMgr.disEnable({id: user.userId, disEnableFlag: 'enable'}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '地区启用成功'});

        $vue.list(); // 刷新列表
      });
    },
    //停用
    disable() {
      this.checkSelect();

      let $vue = this;
      let user = this.retrieve();
      if(user.status == 'disable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此地区已经停用' });
        return;
      }

      MyCuckoo.showDialog({
        msg : '您确认停用此地区?',
        okBtn: '是',
        cancelBtn: '否',
        ok : function() {
          $vue.api.userMgr.disEnable({id: user.userId, disEnableFlag: 'disable'}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: '地区停用成功'});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
  }
}
</script>