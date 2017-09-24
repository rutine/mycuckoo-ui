<template>
  <div>
    <!-- 表单操作按钮 -->
    <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>

    <form class="form-inline" name="editForm" action="">
      <input type="hidden" name="orgId" v-model="organ.orgId"/>
      <table class="table table-bordered">
        <tr>
          <td width=14%><label>机构简称</label></td>
          <td><input type=text  name="orgSimpleName" v-model="organ.orgSimpleName" class="required" maxlength="10"/></td>
          <td width=14%><label>机构全称</label></td>
          <td><input type=text name="orgFullName" v-model="organ.orgFullName" maxlength="60"/></td>
        </tr>
        <tr>
          <td width=14%><label>机构代码</label></td>
          <td><input type=text name="orgCode" v-model="organ.orgCode" class="alphanumeric" maxlength="10"/></td>
          <td width=14%><label>所属地区</label></td>
          <td>
            <input type="hidden" name="orgBelongDist" v-model="organ.orgBelongDist" />
            <input type="text" name="orgBelongDistName" v-model="organ.orgBelongDistName" class="required" />
            <span class="btn btn-warning btn-xs select"><span class="glyphicon glyphicon-search"></span></span>
          </td>
        </tr>
        <tr>
          <td width=14%><label>联系地址1</label></td>
          <td><input type=text name="orgAddress1" v-model="organ.orgAddress1" maxlength="100"/></td>
          <td width=14%><label>联系地址2</label></td>
          <td><input type=text name="orgAddress2" v-model="organ.orgAddress2" maxlength="100"/></td>
        </tr>
        <tr>
          <td width=14%><label>联系电话1</label></td>
          <td><input type=text name="orgTel1" v-model="organ.orgTel1" class="digits" maxlength="15"/></td>
          <td width=14%><label>联系电话2</label></td>
          <td><input type=text name="orgTel2" v-model="organ.orgTel2" class="digits" maxlength="15"/></td>
        </tr>
        <tr>
          <td width=14%><label>成立日期</label></td>
          <td>
            <div id="org_begin_date" class="input-group date">
              <input type="text" class="form-control required" name="orgBeginDate" v-model="organ.orgBeginDate" readOnly />
              <span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>
            </div>
          </td>
          <td width=14%><label>机构类型</label></td>
          <td>
            <select name="orgType" class="required" v-model="organ.orgType">
              <option v-for="item in dicSmallTypes" :value="item.smallTypeCode">{{ item.smallTypeName }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td width=14%><label>机构邮编</label></td>
          <td><input type=text name="orgPostal" v-model="organ.orgPostal" class="digits" maxlength="6"/></td>
          <td width=14%><label>法人代表</label></td>
          <td><input type=text name="orgLegal" v-model="organ.orgLegal" maxlength="10"/></td>
        </tr>
        <tr>
          <td width=14%><label>税务号</label></td>
          <td><input type=text name="orgTaxNo" v-model="organ.orgTaxNo" class="alphanumeric" maxlength="25"/></td>
          <td width=14%><label>注册登记号</label></td>
          <td><input type=text name="orgRegNo" v-model="organ.orgRegNo" class="alphanumeric" maxlength="25"/></td>
        </tr>
        <tr>
          <td width=14%><label>上级机构</label></td>
          <td>
            <input type="hidden" name="parentId" v-model="organ.parentId" />
            <input type="text" name="parentName" v-model="organ.parentName" class="required" />
            <span class="btn btn-warning btn-xs select2"><span class="glyphicon glyphicon-search"></span></span>
          </td>
          <td width=14%><label>备注</label></td>
          <td><input type="text" name="memo" v-model="organ.memo" maxlength="50"/></td>
        </tr>
      </table>
    </form>
  </div>
</template>
<script>
export default {
  props: {
    config: Object
  },
  data () {
    if(this.config.id > -1) {
      this.api.organMgr.view(this.config).then(data => {
        this.organ = data;
      });
    }
    this.api.dictionaryMgr.getSmallType({bigTypeCode: 'organType'}).then(data => {
      this.dicSmallTypes = data;
    });

    return {
      organ: {
        orgId: null,
        parentId: null,
        parentName: null,
        orgSimpleName: null,
        orgFullName: null,
        orgCode: null,
        orgAddress1: null,
        orgAddress2: null,
        orgTel1: null,
        orgTel2: null,
        orgBeginDate: null,
        orgType: null,
        orgFax: null,
        orgPostal: null,
        orgLegal: null,
        orgTaxNo: null,
        orgRegNo: null,
        orgBelongDist: null,
        orgBelongDistName: null,
        status: null,
        memo: null,
        creator: null,
        createDate: null
      },
      dicSmallTypes: null
    }
  },
  mounted() {
    let $vue = this;

    // 用户有效期
    let $html = $(this.$el);
    $html.find('#org_begin_date').datetimepicker({
      language : 'zh-CN',
      format : 'yyyy-mm-dd',
      autoclose : 1,
      todayHighlight: 1,
      todayBtn : 'linked',
      startView : 2,
      minView : 2,
      forceParse : 0
    });

    // 上级机构
    $html.on('click', 'input[name=parentName], .btn.select2', function() {
      var $this = $(this);
      let setting = {
        check : { enable : false},
        callback : {
          onClick : function(evane, treeId, treeNode) {
            $vue.organ.parentId = treeNode.id;
            $vue.organ.parentName = treeNode.text;
            $modal.modal('hide');
          },
          beforeExpand : function(treeId, treeNode) {
            !treeNode.loaded && $vue.api.organMgr.getChildNodes({ treeId: treeNode.id }).then(data => {
              treeNode.loaded = true;
              zTree.addNodes(treeNode, data, true);
            });
          }
        },
        data : { key : { name : 'text', icon : 'iconCls' } },
        view : {
          showLine : true,
          showIcon : false
        }
      }
      var $modal = $(MyCuckoo.modalTemplate);
      $modal.on('hidden.bs.modal', function() { $(this).off().find('.btn').off().end().remove(); });
      $modal.find('.modal-dialog').addClass('modal-sm');
      $modal.find('h3').text('选择上级机构');
      $modal.find('.modal-body').append(
          '<ul class="nav nav-list">' +
          '   <li style="font-size:13px">' +
          '     <strong>机构树</strong>' +
          '   </li>' +
          '   <li><ul class="ztree"></ul></li>' +
          '</ul>');
      $modal.find('.modal-footer .btn:first').remove();
      $modal.modal();
      $modal.appendTo($('body'));

      let zTree = null;
      $vue.api.organMgr.getChildNodes(null).then(data => {
        zTree = $.fn.zTree.init($modal.find('.modal-body .ztree'), setting, data);
      });
    });

    // 所属地区
    $html.on('click', 'input[name=orgBelongDistName], .btn.select', function() {
      var $this = $(this);
      let setting = {
        check : { enable : false},
        callback : {
          onClick : function(evane, treeId, treeNode) {
            $vue.organ.orgBelongDistName = treeNode.id;
            $vue.organ.orgBelongDistName = treeNode.text;
            $modal.modal('hide');
          },
          beforeExpand : function(treeId, treeNode) {
            !treeNode.loaded && $vue.api.districtMgr.getChildNodes({ treeId: treeNode.id }).then(data => {
              treeNode.loaded = true;
              zTree.addNodes(treeNode, data, true);
            });
          }
        },
        data : { key : { name : 'text', icon : 'iconCls' } },
        view : {
          showLine : true,
          showIcon : false
        }
      }
      var $modal = $(MyCuckoo.modalTemplate);
      $modal.on('hidden.bs.modal', function() { $(this).off().find('.btn').off().end().remove(); });
      $modal.find('.modal-dialog').addClass('modal-sm');
      $modal.find('h3').text('选择所属地区');
      $modal.find('.modal-body').append(
          '<ul class="nav nav-list">' +
          '   <li style="font-size:13px">' +
          '     <strong>地区树</strong>' +
          '   </li>' +
          '   <li><ul class="ztree"></ul></li>' +
          '</ul>');
      $modal.find('.modal-footer .btn:first').remove();
      $modal.modal();
      $modal.appendTo($('body'));

      let zTree = null;
      $vue.api.districtMgr.getChildNodes(null).then(data => {
        zTree = $.fn.zTree.init($modal.find('.modal-body .ztree'), setting, data);
      });
    });

  },
  methods: {
    operator(fn) {
      eval('this.' + fn + '()');
    },
    create() {
      let $vue = this;
      this.api.organMgr.create(this.organ).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

        $vue.$emit('refresh');
        this.reback();
      });
    },
    update() {
      let $vue = this;
      this.api.organMgr.update(this.organ).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

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