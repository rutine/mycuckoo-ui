<template>
<div>
    <h3 class="page-header">系统调度管理</h3>

    <!-- 表单操作按钮 -->
    <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>

    <form class="form-inline" name="editForm" method="post">
      <input type="hidden" name="jobId" v-model="formData.jobId"/>
      <div class="jumbotron" style="margin-bottom:10px; padding:15px; font-size:12px;">
        <p><strong class="text-info">基本信息</strong></p>
        <table class="table">
          <tr>
            <td width=14%><label>任务名称</label></td>
            <td><input type=text  name="jobName" v-model="formData.jobName" class="required alphanumeric" maxlength="30"/></td>
            <td width=14%><label>任务类描述</label></td>
            <td><input type=text name="jobClassDescript" v-model="formData.jobClassDescript" class="required" maxlength="100" /></td>
          </tr>
          <tr>
            <td width=14%><label>触发器类型</label></td>
            <td>
              <div class="form-group">
                <label class="radio"><input type="radio" name=triggerType value="Simple" v-model="formData.triggerType" />Simple</label>
                <label class="radio"><input type="radio" name=triggerType value="Cron" v-model="formData.triggerType" />Cron</label>
              </div>
            </td>
            <td width=14%><label>状态</label></td>
            <td>
              <select name="status" class="required">
                <option value="enable" v-model="formData.status">启用</option>
                <option value="disable" v-model="formData.status">停用</option>
              </select>
            </td>
          </tr>
          <tr>
            <td width=14%><label>编码备注</label></td>
            <td colspan="3"><input type="text" name="memo" v-model="formData.memo" maxlength="50"/></td>
          </tr>
        </table>
      </div>
      <div v-show="formData.triggerType == 'Simple'" class="jumbotron" style="margin-bottom:10px; padding:15px; font-size:12px;">
        <p><strong class="text-info">任务设置</strong></p>
        <table class="table">
          <tr>
            <td width=14%><label>开始时间</label></td>
            <td>
              <div id="start_time" class="input-group date">
                <input type=text class="form-control required" name="startTime" v-model="formData.startTime" readOnly />
                <span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>
              </div>
            </td>
            <td width=14%><label>结束时间</label></td>
            <td>
              <div id="end_time" class="input-group date">
                <input type=text class="form-control required" name="endTime" v-model="formData.endTime" readOnly />
                <span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>
              </div>
            </td>
          </tr>
          <tr>
            <td width=14%><label>重复次数</label></td>
            <td><input type=text name="repeatTime" v-model="formData.repeatTime" class="required digits" maxlength="2"  /></td>
            <td width=14%><label>时间间隔</label></td>
            <td><input type=text name="splitTime" v-model="formData.splitTime" class="required digits" maxlength="10" /></td>
          </tr>
        </table>
    </div>
    <div v-show="formData.triggerType == 'Cron'" class="jumbotron" style="margin-bottom:10px; padding:15px; font-size:12px;">
      <p><strong  class="text-info">任务设置</strong></p>
      <table class="table">
        <tr>
          <td width=14%><label>时间表达式</label></td>
          <td><input type=text name="timeExpress" v-model="formData.timeExpress" class="required"  maxlength="20" /></td>
        </tr>
      </table>
    </div>
  </form>
</div>
</template>
<script>
export default {
  props: {
    config: Object
  },
  data() {
    if (this.config.id > -1) {
      this.api.schedulerMgr.view(this.config).then(data => {
        this.formData = data;
      });
    }
    return {
      formData: {
        jobId: null,
        jobName: null,
        jobClassDescript: null,
        triggerType: 'Simple',
        timeExpress: null,
        startTime: null,
        endTime: null,
        repeatTime: null,
        status: null,
        memo: null,
        creator: null,
        createDate: null
      }
    }
  },
  mounted() {
    let $vue = this;

    let $html = $(this.$el);
    //开始时间，结束时间
    var pickerConfig = {
      language : 'zh-CN',
      format : 'yyyy-mm-dd',
      autoclose : 1,
      todayHighlight: 1,
      todayBtn : 'linked',
      startView : 2,
      minView : 2,
      forceParse : 0
    };
    $html.find('#start_time').datetimepicker(pickerConfig);
    $html.find('#end_time').datetimepicker(pickerConfig);

  },
  methods: {
    operator(fn) {
      eval('this.' + fn + '()');
    },
    create() {
      let $vue = this;
      this.api.schedulerMgr.create(this.formData).then(data => {
        MyCuckoo.msg({state: 'success', title: '提示', msg: data});

        $vue.$emit('refresh');
        this.reback();
      });
    },
    update() {
      let $vue = this;
      this.api.schedulerMgr.update(this.formData).then(data => {
        MyCuckoo.msg({state: 'success', title: '提示', msg: data});

        $vue.$emit('refresh');
        this.reback();
      });
    },
    reback() {
      this.config.view = '';
    }
  }

}
</script>