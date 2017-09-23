<template>
  <div class="row">
    <div v-show="!config.view">
    <div class="col-sm-12 col-md-12">
      <!-- 查询表单 -->
      <div class="page-header">
        <form class="form-inline" name="searchForm">
          <div class="form-group">
            <label class="sr-only">中文编码&nbsp;</label>
            <input type="text" class="form-control input-sm" v-model="param.codeName" placeholder=中文编码 />
          </div>
          <div class="form-group">
            <label class="sr-only">英文编码&nbsp;</label>
            <input type="text" class="form-control input-sm" v-model="param.codeEngName" placeholder=英文编码 />
          </div>
          <div class="form-group">
            <label class="sr-only">模块名称&nbsp;</label>
            <input type="text" class="form-control input-sm" v-model="param.moduleName" placeholder=模块名称 />
          </div>
          <button class="btn btn-info btn-sm" name="search" @click="list">&nbsp;查询
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
          <th><input type="checkbox" name="all" @click="selectAll" /></th>
          <th>序号</th>
          <th>英文编码名称</th>
          <th>中文编码名称</th>
          <th>模块名称</th>
          <th>分隔符</th>
          <th>段数</th>
          <th class="hide">段格式</th>
          <th class="hide">段格式内容</th>
          <th>编码效果</th>
          <th>编码状态</th>
          <th class="hide">编码备注</th>
          <th>创建者</th>
          <th>创建日期</th>
        </tr>
        <tr v-for="(item, index) in page.content">
          <td><input type="checkbox" name="single" v-model="selectData" :value="item" /></td>
          <td>{{ index + 1 }}</td>
          <td>{{ item.codeEngName }}</td>
          <td>{{ item.codeName }}</td>
          <td>{{ item.moduleName }}</td>
          <td>{{ item.delimite }}</td>
          <td>{{ item.partNum }}</td>
          <td class="hidden"></td>
          <td class="hidden"></td>
          <td>{{ item.codeEffect }}</td>
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
import mgrForm from './codeMgrForm.vue';

export default {
  data() {
    this.list();

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
  components: {
    mgrForm: mgrForm
  },
  methods: {
    //列表
    list() {
      let $vue = this;
      $vue.selectData = [];
      $vue.api.codeMgr.list($vue.param).then(data => {
        $vue.page = data;
      });
    },
    //清理查询
    clear() {
      for (let p in this.param) {
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
        $vue.page.content.forEach(function (item, i) {
          $vue.selectData.push(item);
        });
      }
    },
    //检查选中
    checkSelect() {
      if (this.selectData.length != 1) {
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
        id: this.selectData[0].codeId
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0].codeId
      }
    },
    //启用
    enable() {
      this.checkSelect();

      let $vue = this;
      let code = this.retrieve();
      if(code.status == 'enable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此编码已经启用' });
        return;
      }

      $vue.api.codeMgr.disEnable({id: code.codeId, disEnableFlag: 'enable'}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '编码启用成功'});

        $vue.list(); // 刷新列表
      });
    },
    //停用
    disable() {
      this.checkSelect();

      let $vue = this;
      let code = this.retrieve();
      if(code.status == 'disable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此编码已经停用' });
        return;
      }

      MyCuckoo.showDialog({
        msg : '您确认停用此编码?',
        okBtn: '是',
        cancelBtn: '否',
        ok : function() {
          $vue.api.codeMgr.disEnable({id: code.codeId, disEnableFlag: 'disable'}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: '编码停用成功'});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
  }
}
</script>