<template>
  <div class="row">
    <div v-show="!config.view">
      <div class="col-sm-3 col-md-2 mycuckoo-sidebar">
        <ul class="nav">
          <li style="font-size:13px">
            <strong>机构树</strong>
          </li>
          <li><ul id="tree_organ" class="ztree"></ul></li>
        </ul>
      </div>

      <div class="col-sm-9 col-md-10 mycuckoo-submain">

        <div>
          <!-- 查询表单 -->
          <div class="page-header">
            <form class="form-inline" name="searchForm">
              <div class="form-group">
                <label class="sr-only">机构简称</label>
                <input type="text" class="form-control input-sm" v-model="param.orgName" placeholder=机构简称 />
              </div>
              <div class="form-group">
                <label class="sr-only">机构代码</label>
                <input type="text" class="form-control input-sm" v-model="param.orgCode" placeholder=机构代码 />
              </div>
              <button type="button" class="btn btn-info btn-sm" @click="list">查询
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
              <th>机构简称</th>
              <th class="hidden">机构全称</th>
              <th>机构代码</th>
              <th>联系地址1</th>
              <th class="hidden">联系地址2</th>
              <th>联系电话1</th>
              <th class="hidden">联系电话2</th>
              <th>成立日期</th>
              <th class="hidden">机构类型</th>
              <th class="hidden">机构邮编</th>
              <th class="hidden">法人代表</th>
              <th class="hidden">税务号</th>
              <th class="hidden">注册登记号</th>
              <th class="hidden">所属地区</th>
              <th>机构状态</th>
              <th class="hidden">备注</th>
              <th>创建人</th>
              <th>创建日期</th>
              <th class="hidden">上级机构</th>
            </tr>
            <tr v-for="(item, index) in page.content">
              <td><input type="checkbox" name="single"  v-model="selectData" :value="item" /></td>
              <td>{{ index + 1 }}</td>
              <td>{{ item.orgSimpleName }}</td>
              <td class="hidden"></td>
              <td>{{ item.orgCode }}</td>
              <td>{{ item.orgAddress1 }}</td>
              <td class="hidden"></td>
              <td>{{ item.orgTel1 }}</td>
              <td class="hidden"></td>
              <td>{{ item.orgBeginDate }}</td>
              <td class="hidden"></td>
              <td class="hidden"></td>
              <td class="hidden"></td>
              <td class="hidden"></td>
              <td class="hidden"></td>
              <td class="hidden"></td>
              <td><selector name="status" :value="item.status"></selector></td>
              <td class="hidden"></td>
              <td>{{ item.creator }}</td>
              <td>{{ item.createDate }}</td>
              <td class="hidden"></td>
            </tr>
          </table>

          <!-- 分页 -->
          <pagination :page="page" v-on:selectPage="selectPage"></pagination>
        </div>
      </div>
    </div>

    <component :is="config.view" :config="config" @refresh="list"></component>
  </div>
</template>
<script>
import mgrForm from './organMgrForm.vue';

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
        orgCode: null,
        orgName: null,
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
          !treeNode.loaded && $vue.api.organMgr.getChildNodes({treeId: treeNode.id}).then(data => {
            treeNode.loaded = true;
            $vue.zTree.addNodes(treeNode, data, true);
          });
        }
      }
    };

    $vue.api.organMgr.getChildNodes(null).then(data => {
      $vue.zTree = $.fn.zTree.init($('#tree_organ'), setting, data);
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
      $vue.api.organMgr.list($vue.param).then(data => {
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
        id: this.selectData[0].orgId
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0].orgId
      }
    },
    //启用
    enable() {
      this.checkSelect();

      let $vue = this;
      let item = this.retrieve();
      if(item.status == 'enable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此机构已经启用' });
        return;
      }

      $vue.api.organMgr.disEnable({id: item.orgId, disEnableFlag: 'enable'}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '机构启用成功'});

        $vue.list(); // 刷新列表
      });
    },
    //停用
    disable() {
      this.checkSelect();

      let $vue = this;
      let item = this.retrieve();
      if(item.status == 'disable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此机构已经停用' });
        return;
      }

      MyCuckoo.showDialog({
        msg : '您确认停用此机构吗.',
        okBtn: '是',
        cancelBtn: '否',
        ok : function() {
          $vue.api.organMgr.disEnable({id: item.orgId, disEnableFlag: 'disable'}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: '机构停用成功'});

            $vue.list(); // 刷新列表
          });
        }
      });
    },

  }
}
</script>