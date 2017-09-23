<template>
  <div>
    <!-- 表单操作按钮 -->
    <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>
    
    <form name="editForm" action="">
      <input type="hidden" name="moduleId" v-model="module.moduleId"/>
      <table class="table table-bordered">
        <tr>
          <td width=14%><label>模块名称</label></td>
          <td><input type=text  name="modName" v-model="module.modName" class="required" maxlength="10"/></td>
          <td width=14%><label>模块英文ID</label></td>
          <td><input type=text name="modEnId" v-model="module.modEnId" class="required" maxlength="40"/></td>
        </tr>
        <tr>
          <td width=14%><label>模块图片样式</label></td>
          <td><input type=text name="modImgCls" v-model="module.modImgCls" class="alphanumeric" /></td>
          <td width=14%><label>模块级别</label></td>
          <td>
            <select name="modLevel" class="required" v-model="module.modLevel">
              <option :value="1">第一</option>
              <option :value="2">第二</option>
              <option :value="3">第三</option>
            </select>
          </td>
        </tr>
        <tr>
          <td width=14%><label>模块顺序</label></td>
          <td>
            <select name="modOrder" class="required" v-model="module.modOrder">
              <option :value="1">1</option>
              <option :value="2">2</option>
              <option :value="3">3</option>
              <option :value="4">4</option>
              <option :value="5">5</option>
              <option :value="6">6</option>
              <option :value="7">7</option>
              <option :value="8">8</option>
              <option :value="9">9</option>
            </select>
          </td>
          <td width=14%><label>所属系统</label></td>
          <td>
            <!--<c:import url="/platform/typeDictionaryMgr/getSmallTypeDicByBigTypeCode">
              <c:param name="selectName" value="belongToSys" />
              <c:param name="selectCode" v-model="module.belongToSys" />
              <c:param name="selectClass" value="required" />
              <c:param name="bigTypeCode" value="systemType" />
            </c:import>-->
            <select name="orgType" class="required" v-model="module.belongToSys">
              <option v-for="item in systemTypes" :value="item.smallTypeCode">{{ item.smallTypeName }}</option>
            </select>
          </td>
        </tr>
        <tr>
          <td width=14%><label>页面类型</label></td>
          <td>
           <!-- <c:import url="/platform/typeDictionaryMgr/getSmallTypeDicByBigTypeCode">
              <c:param name="selectName" value="modPageType" />
              <c:param name="selectCode" v-model="module.modPageType" />
              <c:param name="selectClass" value="required" />
              <c:param name="bigTypeCode" value="modPageType" />
            </c:import>-->
            <select name="orgType" class="required" v-model="module.modPageType">
              <option v-for="item in modPageTypes" :value="item.smallTypeCode">{{ item.smallTypeName }}</option>
            </select>
          </td>
          <td width=14%><label>模块状态</label></td>
          <td>
            <select name="status" class="required" v-model="module.status">
              <option value="enable">启用</option>
              <option value="disable">停用</option>
            </select>
          </td>
        </tr>
        <tr>
          <td width=14%><label>模块的上级名称</label></td>
          <td>
            <input type="hidden" name="parentId" v-model="module.parentId" />
            <input type="text" name="parentName" v-model="module.parentName" class="required" />
            <span class="btn btn-warning btn-xs select"><span class="glyphicon glyphicon-search"></span></span>
          </td>
          <td width=14%><label>备注</label></td>
          <td><input type="text" name="memo" v-model="module.memo" maxlength="50"/></td>
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
      this.api.moduleMgr.view(this.config).then(data => {
        this.module = data;
      });
    }
    this.api.typeDictionaryMgr.getSmallType({bigTypeCode: 'modPageType'}).then(data => {
      this.modPageTypes = data;

    });
    this.api.typeDictionaryMgr.getSmallType({bigTypeCode: 'systemType'}).then(data => {
      this.systemTypes = data;

    });

    return {
      module: {
        moduleId: null,
        parentId: null,
        parentName: null,
        modName: null,
        modEnId: null,
        modImgCls: null,
        modLevel: null,
        modOrder: null,
        modPageType: null,
        belongToSys: null,
        status: null,
        memo: null,
        creator: null,
        createDate: null
      },
      modPageTypes: null,
      systemTypes: null
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

    // 上级模块
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
            !treeNode.loaded && $vue.api.moduleMgr.getChildNodes({ treeId: treeNode.id }).then(data => {
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
      $modal.find('h3').text('选择上级模块');
      $modal.find('.modal-body').append(
          '<ul class="nav nav-list">' +
          '   <li style="font-size:13px">' +
          '     <strong>模块树</strong>' +
          '   </li>' +
          '   <li><ul class="ztree"></ul></li>' +
          '</ul>');
      $modal.find('.modal-footer .btn:first').remove();
      $modal.modal();
      $modal.appendTo($('body'));

      let zTree = null;
      $vue.api.moduleMgr.getChildNodes(null).then(data => {
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
      this.api.moduleMgr.create(this.module).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

        $vue.$emit('refresh');
        this.reback();
      });
    },
    update() {
      let $vue = this;
      this.api.moduleMgr.update(this.module).then(data => {
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