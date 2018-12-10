<template>
  <div class="row">
    <div v-show="!config.view">
    <div class="col-sm-12 col-md-12">

      <!-- 查询表单 -->
      <div class="page-header">
        <form class="form-inline" name="searchForm">
          <div class="form-group">
            <label class="sr-only">字典大类名称&nbsp;</label>
            <input type="text" class="form-control input-sm" v-model="param.bigTypeName" placeholder=字典大类名称 />
          </div>
          <div class="form-group">
            <label class="sr-only">字典大类代码&nbsp;</label>
            <input type="text" class="form-control input-sm" v-model="param.bigTypeCode" placeholder=字典大类代码 />
          </div>
          <button class="btn btn-info btn-sm" @click="list">&nbsp;查询
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
          <th><input type="checkbox" name="all" @click="selectAll" /></th>
          <th>序号</th>
          <th>字典大类名称</th>
          <th>字典大类代码</th>
          <th class="hide">字典小类名称</th>
          <th class="hide">字典小类代码</th>
          <th>字典状态</th>
          <th>创建者</th>
          <th>创建日期</th>
          <th class="hide">字典备注</th>
        </tr>
        <tr v-for="(item, index) in page.content">
          <td><input type="checkbox" name="single" v-model="selectData" :value="item" /></td>
          <td>{{ index + 1 }}</td>
          <td>{{ item.bigTypeName }}</td>
          <td>{{ item.bigTypeCode }}</td>
          <td class="hide"></td>
          <td class="hide"></td>
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
import mgrForm from './dictionaryMgrForm.vue';

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
        bigTypeCode: null,
        bigTypeName: null,
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
      $vue.api.dictionaryMgr.list($vue.param).then(data => {
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
        MyCuckoo.msg({state: 'warning', title: '提示', msg: '请选择一条件记录!'});
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
        id: this.selectData[0].bigTypeId
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0].bigTypeId
      }
    },
    //启用
    enable() {
      this.checkSelect();

      let $vue = this;
      let item = this.retrieve();
      if(item.status == 'enable') {
        MyCuckoo.msg({ state: 'info', title : '提示', msg : '此类别字典已经启用' });
        return;
      }

      $vue.api.dictionaryMgr.disEnable({id: item.bigTypeId, disEnableFlag: 'enable'}).then(data => {
        MyCuckoo.msg({state: 'success', title: '提示', msg: '类别字典启用成功'});

        $vue.list(); // 刷新列表
      });
    },
    //停用
    disable() {
      this.checkSelect();

      let $vue = this;
      let item = this.retrieve();
      if(item.status == 'disable') {
        MyCuckoo.msg({ state: 'info', title : '提示', msg : '此类别字典已经停用' });
        return;
      }

      MyCuckoo.confirm({
        msg : '您确认停用此类别字典?',
        okBtn: '是',
        cancelBtn: '否',
        ok : function() {
          $vue.api.dictionaryMgr.disEnable({id: item.bigTypeId, disEnableFlag: 'disable'}).then(data => {
            MyCuckoo.msg({state: 'success', title: '提示', msg: '类别字典停用成功'});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
  }
}
</script>