<template>
<div>
  <div class="btn-toolbar">
    <div class="btn-group">
      <a href="javascript:" @click="save" class="btn btn-default btn-sm" data-loading-text="执行中...">保存
        <span class="glyphicon glyphicon-hdd"></span>
      </a>
      <a href="javascript:" @click="config.view = ''" class="btn btn-default btn-sm" data-loading-text="执行中...">返回
        <span class="glyphicon glyphicon-circle-arrow-left"></span>
      </a>
    </div>
  </div>

  <table class="table table-striped table-hover table-condensed">
    <tr>
      <th><input type="checkbox" name="all"/></th>
      <th>序号</th>
      <th>角色名称</th>
      <th>角色状态</th>
      <th class="hidden">备注</th>
      <th>创建人</th>
      <th>创建日期</th>
    </tr>

    <tr v-for="(item, index) in page.content">
      <td><input type="checkbox" name="single" v-model="selectData" :value="item"  /></td>
      <td>{{ index + 1 }}</td>
      <td>{{ item.roleName }}</td>
      <td><selector name="status" :value="item.status"></selector></td>
      <td class="hidden"></td>
      <td>{{ item.creator }}</td>
      <td>{{ item.createDate }}</td>
    </tr>
  </table>

  <!-- 分页 -->
  <pagination :page="page" v-on:selectPage="selectPage"></pagination>
</div>
</template>
<script>
export default {
  props: {
    config: Object
  },
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
        pageNo: 1,
        pageSize: 10
      },
      selectData: [],
      config: {}
    }
  },
  mounted() {
    this.param['treeId'] = this.config.organ.id;
    this.list();
  },
  methods: {
    //列表
    list() {
      let $vue = this;
      $vue.selectData = [];
      $vue.api.organRoleMgr.listUnselectRole($vue.param).then(data => {
        $vue.page = data;
      });
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

    //保存分配给机构的角色
    save() {
      let $vue = this;
      if($vue.selectData.length == 0) {
        MyCuckoo.showMsg({state: 'danger', title: '提示', msg: '请选择一条或多条记录!'});
        return;
      }

      let roleIdList = [];
      $vue.selectData.forEach(item => {
        roleIdList.push(item.roleId);
      });

      let params = {id : $vue.config.organ.id, roleIdList : roleIdList};
      this.api.organRoleMgr.save(params).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

        $vue.$emit('refresh');
        $vue.config.view = '';
      });
    }

  }
}
</script>