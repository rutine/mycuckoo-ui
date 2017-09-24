<template>
  <div class="row">
    <div class="col-sm-12 col-md-12">
      <h3 class="page-header">系统配置管理</h3>
      <div class="row">
        <div class="col-sm-6 col-md-6">
          <div class="thumbnail">
            <div class="caption">
              <form action="#" class="form-inline">
                <div class="form-group">
                  <label class="control-label" for="systemName">系统名称&nbsp;</label>
                  <input type="text" class="form-control" name="systemName" v-model="systemConfigBean.systemName" required/>
                </div>
                <p></p>
                <p><button type="button" class="btn btn-primary" data-loading-text="处理中..." @click="saveName">设置</button></p>
              </form>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-6">
          <div class="thumbnail">
            <div class="caption">
              <form action="#" class="form-inline">
                <div class="form-group">
                  <label class="control-label" for="systemMgr">管理员列表&nbsp;</label>
                  <select class="form-control" name="systemMgr">
                    <option v-for="systemMgr in systemConfigBean.systemMgr" :value="systemMgr">{{ systemMgr }}</option>
                  </select>
                </div>
                <p></p>
                <p>
                  <button type="button" class="btn btn-primary" data-loading-text="处理中..." @click="selectAdmin('add')">增加</button>
                  <button type="button" class="btn" data-loading-text="处理中..." @click="selectAdmin('delete')">删除</button>
                </p>
              </form>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-6">
          <div class="thumbnail">
            <div class="caption">
              <form action="#" class="form-inline">
                <label class="control-label">日志级别</label>
                <div class="radio">
                  <label class="radio-inline"><input type="radio" name=loggerLevel value="1" v-model="systemConfigBean.loggerLevel" />增、删、改</label>
                  <label class="radio-inline"><input type="radio" name=loggerLevel value="2" v-model="systemConfigBean.loggerLevel" />删、改、其它</label>
                  <label class="radio-inline"><input type="radio" name=loggerLevel value="3" v-model="systemConfigBean.loggerLevel" />删、其它</label>
                  <label class="radio-inline"><input type="radio" name=loggerLevel value="0" v-model="systemConfigBean.loggerLevel" />关闭</label>
                </div>
                <p></p>
                <p><button type="button" class="btn btn-primary" data-loading-text="处理中..." @click="saveLogLevel">设置</button></p>
              </form>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-6">
          <div class="thumbnail">
            <div class="caption">
              <form action="#" class="form-inline">
                <div class="form-group">
                  <label class="control-label" for="logRecordKeepDays">保留天数&nbsp;</label>
                  <select class="form-control" name="logRecordKeepDays" v-model="systemConfigBean.logRecordKeepDays">
                    <option value="-1">不设置</option>
                    <option value="3">3天</option>
                    <option value="7">7天</option>
                    <option value="15">15天</option>
                    <option value="30">30天</option>
                    <option value="60">60天</option>
                    <option value="90">90天</option>
                    <option value="180">180天</option>
                    <option value="360">360天</option>
                  </select>
                </div>
                <p></p>
                <p><button type="button" class="btn btn-primary" data-loading-text="处理中..." @click="saveLogKeepDays">设置</button></p>
              </form>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-6">
          <div class="thumbnail">
            <div class="caption">
              <form action="#" class="form-inline">
                <div class="form-group">
                  <label>监控设置</label><br>
                  <b>windows tomcat监控,在catalina.bat加入:</b><br>
                  <code>set JAVA_HOME=C:\Program Files\Java\jdk1.6.0_18</code><br>
                  <code>set PATH=%PATH%;%JAVA_HOME%\bin</code><br>
                  <code>set CLASSPATH=%CLASSPATH%;%JAVA_HOME%</code><br>
                  <code>set JAVA_OPTS=%JAVA_OPTS%</code><br>
                  <code>-Dcom.sun.management.jmxremote</code><br>
                  <code>-Dsun.io.useCanonCaches=false</code><br>
                  <code>-Dcom/sun/management/jmxremote/port=9999</code><br>
                  <code>-Dcom/sun/management/jmxremote/ssl=false</code><br>
                  <code>-Dcom/sun/management/jmxremote/authenticate=false</code><br>
                  <code>-Xms512m -Xmx512m -XX:MaxNewSize=256m -XX:MaxPermSize=256m</code>
                </div>
                <p></p>
                <p><button type="button" class="btn btn-primary" data-loading-text="处理中..." @click="startJConsole">启动</button></p>
              </form>
            </div>
          </div>
        </div>
        <div class="col-sm-6 col-md-6">
          <div class="thumbnail">
            <div class="caption">
              <form action="#" class="form-inline">
                <label class="control-label">行权限级别</label>
                <div class="radio">
                  <label class="radio-inline"><input type="radio" name=rowPrivilegeLevel value="org" v-model="systemConfigBean.rowPrivilegeLevel" />机构</label>
                  <label class="radio-inline"><input type="radio" name=rowPrivilegeLevel value="rol" v-model="systemConfigBean.rowPrivilegeLevel" />角色</label>
                  <label class="radio-inline"><input type="radio" name=rowPrivilegeLevel value="usr" v-model="systemConfigBean.rowPrivilegeLevel" />用户</label>
                </div>
                <p></p>
                <p><button type="button" class="btn btn-primary" data-loading-text="处理中..." @click="saveRowPrivilege">设置</button></p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal -->
    <div id="system_config_mgr_form_modal" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            <h3>选择用户</h3>
          </div>
          <div class="modal-body">
            <!-- 管理员选择 -->
            <div>

              <div v-if="'add' == param.userAddDelFlag">
                <form class="form-inline" name="searchForm">
                  <input type="hidden" name="userAddDelFlag" v-model="param.userAddDelFlag" />
                  <div class="form-group">
                    <label class="sr-only">用户号&nbsp;</label>
                    <input type="text" class="form-control input-sm" v-model="param.userCode" placeholder=用户号 />
                  </div>
                  <div class="form-group">
                    <label class="sr-only">用户名&nbsp;</label>
                    <input type="text" class="form-control input-sm" v-model="param.userName" placeholder=用户名 />
                  </div>
                  <button type="button" class="btn btn-info btn-sm" name="search" @click="list">&nbsp;查询
                    <span class="glyphicon glyphicon-search"></span>
                  </button>
                  <button type="button" class="btn btn-default btn-sm" name="clear" @click="clear">&nbsp;清空
                    <span class="glyphicon glyphicon-repeat"></span>
                  </button>
                </form>
              </div>
              <table class="table table-striped table-hover table-condensed">
                <tr>
                  <th><input type="checkbox" name="all" @click="selectAll" /></th>
                  <th>序号</th>
                  <th>用户号</th>
                  <th>用户名</th>
                  <th>性别</th>
                  <th>职位</th>
                  <th>所属机构</th>
                  <th>所属角色</th>
                </tr>

                <tr v-for="(item, index) in page.content">
                  <td><input type="checkbox" name="single" v-model="selectData" :value="item" /></td>
                  <td>{{ index + 1 }}</td>
                  <td>{{ item.userCode }}</td>
                  <td>{{ item.userName }}</td>
                  <td><selector name="status" :value="item.status"></selector></td>
                  <td>{{ item.userPosition }}</td>
                  <td>{{ item.orgName }}</td>
                  <td>{{ item.roleName }}</td>
                </tr>
              </table>

              <!-- 分页 -->
              <pagination :page="page" v-on:selectPage="selectPage"></pagination>

            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-primary" data-loading-text="处理中..." @click="saveSystemAdmin">保存</button>
            <button class="btn btn-default" data-dismiss="modal" aria-hidden="true">关闭</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  data() {
    this.refresh();

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
        userAddDelFlag: null,
        userCode: null,
        userName: null,
        pageNo: 1,
        pageSize: 10
      },
      selectData: [],
      config: {},

      systemConfigBean: {
        loggerLevel: null,
        logRecordKeepDays: null,
        systemMgr: [],
        systemName: null,
        cluster: null,
        rowPrivilegeLevel: null,
        tomcatJmxURL: null,
        tomcatObjectName: null,
        jmxDefault: null,
        userAddDelFlag: null
      }
    }
  },
  methods: {
    //列表
    list() {
      let $vue = this;
      $vue.selectData = [];
      $vue.api.systemConfigMgr.list($vue.param).then(data => {
        $vue.page = data;
      });
    },
    //清理查询
    clear() {
      for(let p in this.param) {
        if(p == 'userAddDelFlag') {
          continue
        }
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
    //刷新当前页
    refresh() {
      this.api.systemConfigMgr.view(this.config).then(data => {
        this.systemConfigBean = data;
      });
    },


    //选择管理员
    selectAdmin(userAddDelFlag) {
      this.param.userAddDelFlag = userAddDelFlag;
      this.systemConfigBean.userAddDelFlag = userAddDelFlag;

      let $modal = $('#system_config_mgr_form_modal');
      $modal.modal();

      this.list();
    },

    // 系统名称设置
    saveName() {
      this.api.systemConfigMgr.update({systemName: this.systemConfigBean.systemName}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});
        this.refresh();
      });
    },
    // 系统管理员设置
    saveSystemAdmin() {
      this.checkSelect();

      let userCodes = [];
      this.selectData.forEach(item => {
        userCodes.push(item.userCode);
      });

      this.api.systemConfigMgr.update({
            userAddDelFlag :  this.systemConfigBean.userAddDelFlag,
            systemMgr : userCodes
          }).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});
        this.refresh();
      });
    },
    // 系统日志级别设置
    saveLogLevel() {
      this.api.systemConfigMgr.update({loggerLevel: this.systemConfigBean.loggerLevel}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});
        this.refresh();
      });
    },
    // 系统日志保留天数设置
    saveLogKeepDays() {
      this.api.systemConfigMgr.update({logRecordKeepDays: this.systemConfigBean.logRecordKeepDays}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});
        this.refresh();
      });
    },
    // 系统监控设置
    startJConsole() {
      this.api.systemConfigMgr.startJConsole(null).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data})
        this.refresh();
      });
    },
    //系统行权限设置
    saveRowPrivilege() {
      this.api.systemConfigMgr.update({rowPrivilegeLevel: this.systemConfigBean.rowPrivilegeLevel}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});
        this.refresh();
      });
    }

  }
}
</script>