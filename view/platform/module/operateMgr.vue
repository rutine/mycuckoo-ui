<template>
  <div class="row">
    <div v-show="!config.view">
    <div class="col-sm-12 col-md-12">

      <!-- 查询表单 -->
      <div class="page-header">
        <form class="form-inline" name="searchForm">
          <div class="form-group">
            <label class="sr-only">操作名称&nbsp;</label>
            <input type="text" class="form-control input-sm" v-model="param.operateName" placeholder=操作名称 />
          </div>
          <button class="btn btn-info btn-sm" @click="list">&nbsp;查询
            <span class="glyphicon glyphicon-search"></span>
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
          <th>操作名称</th>
          <th>图片链接</th>
          <th>功能链接</th>
          <th>操作顺序</th>
          <th>操作组</th>
          <th>模块状态</th>
          <th>创建者</th>
          <th>创建日期</th>
          <th class="hide">模块备注</th>
        </tr>
        <tr v-for="(item, index) in page.content">
          <td><input type="checkbox" name="single" v-model="selectData" :value="item" /></td>
          <td>{{ index + 1 }}</td>
          <td>{{ item.operateName }}</td>
          <td>{{ item.optImgLink }}</td>
          <td>{{ item.optFunLink }}</td>
          <td>{{ item.optOrder }}</td>
          <td>{{ item.optGroup }}</td>
          <td><selector name="status" :value="item.status"></selector></td>
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
import mgrForm from './operateMgrForm.vue';

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
        operateName: null,
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
      $vue.api.operateMgr.list($vue.param).then(data => {
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
        id: this.selectData[0].operateId
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0].operateId
      }
    },
    //启用
    enable() {
      this.checkSelect();

      let $vue = this;
      let user = this.retrieve();
      if(user.status == 'enable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此操作已经启用' });
        return;
      }

      $vue.api.operateMgr.disEnable({id: user.userId, disEnableFlag: 'enable'}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '操作启用成功'});

        $vue.list(); // 刷新列表
      });
    },
    //停用
    disable() {
      this.checkSelect();

      let $vue = this;
      let user = this.retrieve();
      if(user.status == 'disable') {
        MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此操作已经停用' });
        return;
      }

      MyCuckoo.showDialog({
        msg : '您确认停用此操作吗? 如果停用,相应模块下的此操作将自动清除,并重登生效.',
        okBtn: '是',
        cancelBtn: '否',
        ok : function() {
          $vue.api.operateMgr.disEnable({id: user.userId, disEnableFlag: 'disable'}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: '操作停用成功'});

            $vue.list(); // 刷新列表
          });
        }
      });
    }
    //end
  }
}
</script>