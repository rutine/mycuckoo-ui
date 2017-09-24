<template>
  <div class="row">
    <div v-show="!config.view">
    <div class="col-sm-12 col-md-12">

      <!-- 查询表单 -->
      <div class="page-header">
        <form class="form-inline" name="searchForm">
          <div class="form-group">
            <label class="sr-only">任务名称&nbsp;</label>
            <input type="text" class="form-control input-sm" v-model="param.jobName" placeholder=任务名称 />
          </div>
          <div class="form-group">
            <label>触发器类型:&nbsp;</label>
            <label class="radio-inline">
              <input type="radio" name="triggerType" value="Simple" v-model="param.triggerType"> 是&nbsp;&nbsp;
            </label>
            <label class="radio-inline">
              <input type="radio" name="triggerType" value="Cron" v-model="param.triggerType"> 否&nbsp;&nbsp;
            </label>
          </div>
          <button type="submit" class="btn btn-info btn-sm" name="search" @click="list">&nbsp;查询
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
          <th>任务名称</th>
          <th>任务类描述</th>
          <th>触发器类型</th>
          <th class="hide">时间表达式</th>
          <th class="hide">开始时间</th>
          <th class="hide">结束时间</th>
          <th class="hide">重复次数</th>
          <th class="hide">时间间隔(秒)</th>
          <th>任务状态</th>
          <th class="hide">参数备注</th>
          <th>创建者</th>
          <th>创建日期</th>
        </tr>
        <tr v-for="(item, index) in page.content">
          <td><input type="checkbox" name="single" v-model="selectData" :value="item"/></td>
          <td>{{ index + 1 }}</td>
          <td>{{ item.jobName }}</td>
          <td>{{ item.jobClassDescript }}</td>
          <td>{{ item.triggerType }}</td>
          <td class="hide"></td>
          <td class="hide"></td>
          <td class="hide"></td>
          <td class="hide"></td>
          <td class="hide"></td>
          <td><selector name="status" :value="item.status"></selector></td>
          <td class="hide"></td>
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
import mgrForm from './schedulerMgrForm.vue';

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
        jobName: null,
        triggerType: null,
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
      $vue.api.schedulerMgr.list($vue.param).then(data => {
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
        id: this.selectData[0].jobId
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0].jobId
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
        ok: function () {
          $vue.api.userMgr.del({id: $vue.selectData[0].jobId}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
    //启动调度器
    schedulerStart() {
      let $vue = this;
      $vue.api.schedulerMgr.startScheduler(null).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});
        $vue.list(); // 刷新列表
      });
    },
    //停止调度器
    schedulerStop() {
      let $vue = this;
      $vue.api.schedulerMgr.stopScheduler(null).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});
        $vue.list(); // 刷新列表
      });
    },
    //启动任务
    jobStart() {
      this.checkSelect();

      let $vue = this;
      let item = this.retrieve();
      if (item.status == 'enable') {
        MyCuckoo.showMsg({state: 'info', title: '提示', msg: '此任务已经启用'});
        return;
      }

      $vue.api.schedulerMgr.startJob({jobId: item.jobId, jobName: item.jobName}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '任务启用成功'});

        $vue.list(); // 刷新列表
      });
    },
    //停止任务
    jobStop() {
      this.checkSelect();

      let $vue = this;
      let item = this.retrieve();
      if (item.status == 'disable') {
        MyCuckoo.showMsg({state: 'info', title: '提示', msg: '此任务已经停止'});
        return;
      }

      $vue.api.schedulerMgr.stopJob({jobId: item.jobId, jobName: item.jobName}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '任务停止成功'});

        $vue.list(); // 刷新列表
      });
    }
  }
}
</script>