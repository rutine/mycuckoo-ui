<template>
  <div class="row">
    <div class="col-sm-12 col-md-12">
      <!-- 查询表单 -->
      <div class="page-header">
        <form class="form-inline" name="searchForm">
          <table>
            <tr>
              <td><label>操作模块名&nbsp;</label></td>
              <td><input class="form-control input-sm" type="text" v-model="param.optModName" placeholder="操作模块名" />&nbsp;&nbsp;</td>
              <td><label>操作名&nbsp;</label></td>
              <td><input class="form-control input-sm" type="text" v-model="param.optName" placeholder="操作名" />&nbsp;&nbsp;</td>
              <td><label>操作人姓名&nbsp;</label></td>
              <td><input class="form-control input-sm" type="text" v-model="param.optUserName" placeholder="操作人姓名" />&nbsp;&nbsp;</td>
              <td>
                <button class="btn btn-info" @click="list"><span class="glyphicon glyphicon-search"></span>查询</button>
                <button class="btn" @click="clear"><span class="glyphicon glyphicon-repeat"></span>清空</button>
              </td>
            </tr>
          </table>
        </form>
      </div>

      <!-- 模块操作按钮 -->
      <toolbar name="moduleOpt" :value="menu.fourth[$route.params.moduleId]" v-on:operator="operator"></toolbar>

      <!-- 内容列表 -->
      <table class="table table-striped table-hover table-condensed">
        <tr>
          <th><input type="checkbox" name="all" @click="selectAll" /></th>
          <th>序号</th>
          <th>操作模块名</th>
          <th>操作名</th>
          <th class="hide">操作内容</th>
          <th>业务数据ID</th>
          <th>计算机名称</th>
          <th>计算机IP</th>
          <th>操作人姓名</th>
          <th>操作人角色</th>
          <th>操作人机构</th>
          <th>操作时间</th>
          <th class="hide">开始时间</th>
          <th class="hide">结束时间</th>
        </tr>
        <tr v-for="(item, index) in page.content">
          <td><input type="checkbox" name="single" v-model="selectData" :value="item"/></td>
          <td>{{ index + 1 }}</td>
          <td>{{ item.optModName }}</td>
          <td>{{ item.optName }}</td>
          <td class="hide">{{ item.optContent  }}</td>
          <td>{{ item.optBusinessId }}</td>
          <td>{{ item.optPcName }}</td>
          <td>{{ item.optPcIp }}</td>
          <td>{{ item.optUserName }}</td>
          <td>{{ item.optUserRole }}</td>
          <td>{{ item.optUserOgan }}</td>
          <td>{{ item.optTime }}</td>
          <td class="hide"></td>
          <td class="hide"></td>
        </tr>
      </table>

      <!-- 分页 -->
      <pagination :page="page" v-on:selectPage="selectPage"></pagination>
    </div>
  </div>
</template>
<script>
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
        optModName: null,
        optName: null,
        optUserName: null,
        pageNo: 1,
        pageSize: 10
      },
      selectData: [],
      config: {}
    }
  },
  methods: {
    //列表
    list() {
      let $vue = this;
      $vue.selectData = [];
      $vue.api.systemLogMgr.list($vue.param).then(data => {
        $vue.page = data;
      });
    },
    //清理查询
    clear() {
      for (let p in this.param) {
        this.param[p] = null;
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


    //查看
    view() {
      this.checkSelect();

      this.api.systemLogMgr.view({id: this.selectData[0].optId}).then(data => {
        MyCuckoo.showDialog({
          title : '日志内容查看',
          msg : data
        });
      });
    },
    // the end
  }
}
</script>
