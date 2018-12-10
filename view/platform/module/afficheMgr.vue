<template>
  <div class="row">
    <div v-show="!config.view">
    <div class="col-sm-12 col-md-12">
      <!-- 查询表单 -->
      <div class="page-header">
        <form class="form-inline" name="searchForm">
          <div class="form-group">
            <label class="sr-only">公告标题:&nbsp;</label>
            <input type="text" class="form-control input-sm" v-model="param.afficheTitle" placeholder=公告标题 />
          </div>
          <div class="form-group">
            <label>是否发布:&nbsp;</label>
            <label class="radio-inline">
              <input type="radio" name="affichePulish" value="0" v-model="param.affichePulish"> 是&nbsp;&nbsp;
            </label>
            <label class="radio-inline">
              <input type="radio" name="affichePulish" value="1" v-model="param.affichePulish"> 否&nbsp;&nbsp;
            </label>
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
          <th><input type="checkbox" name="all" @click="selectAll"/></th>
          <th>序号</th>
          <th>公告标题</th>
          <th>有效日期</th>
          <th>是否发布</th>
          <th class="hide">公告正文</th>
          <th class="hide">公告附件</th>
        </tr>
        <tr v-for="(item, index) in page.content">
          <td><input type="checkbox" name="single" v-model="selectData" :value="item" /></td>
          <td>{{ index + 1 }}</td>
          <td>{{ item.afficheTitle }}</td>
          <td>{{ item.afficheInvalidate }}</td>
          <td>
            <span v-if="item.affichePulish == 0">已发布</span>
            <span v-else-if="item.affichePulish == 1">未发布</span>
          </td>
          <td class="hide"></td>
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
import mgrForm from './afficheMgrForm.vue';

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
        afficheTitle: null,
        affichePulish: null,
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
      $vue.api.afficheMgr.list($vue.param).then(data => {
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
        id: this.selectData[0].afficheId
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0].afficheId
      }
    },
    //删除
    delete() {
      this.checkSelect();

      let $vue = this;
      MyCuckoo.confirm({
        title: '警告提示',
        msg: '您确认删除此记录吗?',
        okBtn: '是',
        cancelBtn: '否',
        ok: function() {
          $vue.api.afficheMgr.del({ids: $vue.selectData[0].afficheId}).then(data => {
            MyCuckoo.msg({state: 'success', title: '提示', msg: data});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
    //end
  }
}
</script>