<template>
  <div>
    <!-- 表单操作按钮 -->
    <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>

    <form name="editForm" action="">
      <input type="hidden" name="districtId" v-model="district.districtId"/>
      <table class="table table-bordered">
        <tr>
          <td width=14%><label>地区名称</label></td>
          <td><input type=text  name="districtName" v-model="district.districtName" class="required" maxlength="10"/></td>
          <td width=14%><label>地区代码</label></td>
          <td><input type=text name="districtCode" v-model="district.districtCode" maxlength="10"/></td>
        </tr>
        <tr>
          <td width=14%><label>地区邮编</label></td>
          <td><input type=text name="districtPostal" v-model="district.districtPostal" class="digits" maxlength="6"/></td>
          <td width=14%><label>电话区号</label></td>
          <td><input type=text name="districtTelcode" v-model="district.districtTelcode" class="digits" maxlength="10"/></td>
        </tr>
        <tr>
          <td width=14%><label>地区级别</label></td>
          <td>
            <select name="districtLevel" class="required" v-model="district.districtLevel">
              <option v-for="item in dicSmallTypes" :value="item.smallTypeCode">{{ item.smallTypeName }}</option>
            </select>
          </td>
          <td width=14%><label>地区状态</label></td>
          <td>
            <select name="status" class="required" v-model="district.status">
              <option value="enable">启用</option>
              <option value="disable">停用</option>
            </select>
          </td>
        </tr>
        <tr>
          <td width=14%><label>上级地区</label></td>
          <td>
            <input type="hidden" name="upDistrictId" v-model="district.parentId" />
            <input type="text" name="upDistrictName" v-model="district.parentName" class="required" />
            <span class="btn btn-warning btn-xs select"><span class="glyphicon glyphicon-search"></span></span>
          </td>
          <td width=14%><label>备注</label></td>
          <td><input type="text" name="memo" v-model="district.memo" maxlength="50"/></td>
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
        this.api.districtMgr.view(this.config).then(data => {
          this.district = data;
        });
      }
      this.api.typeDictionaryMgr.getSmallType({bigTypeCode: 'district'}).then(data => {
        this.dicSmallTypes = data;
      });

      return {
        district: {
          districtId: null,
          parentId: null,
          parentName: null,
          districtName: null,
          districtCode: null,
          districtPostal: null,
          districtTelcode: null,
          districtLevel: null,
          status: null,
          memo: null,
          creator: null,
          createDate: null
        },
        dicSmallTypes: []
      }
    },
    mounted() {
      let $vue = this;

      let $html = $(this.$el);

      // 所属地区
      $html.on('click', 'input[name=parentName], .btn.select', function() {
        var $this = $(this);
        let setting = {
          check : { enable : false},
          data : { key : { name : 'text', icon : 'iconCls' } },
          view : {
            showLine : true,
            showIcon : false
          },
          callback : {
            onClick : function(evane, treeId, treeNode) {
              $vue.district.parentId = treeNode.id;
              $vue.district.parentName = treeNode.text;
              $modal.modal('hide');
            },
            beforeExpand : function(treeId, treeNode) {
              !treeNode.loaded && $vue.api.districtMgr.getChildNodes({ treeId: treeNode.id }).then(data => {
                treeNode.loaded = true;
                zTree.addNodes(treeNode, data, true);
              });
            }
          }
        }
        var $modal = $(MyCuckoo.modalTemplate);
        $modal.on('hidden.bs.modal', function() { $(this).off().find('.btn').off().end().remove(); });
        $modal.find('.modal-dialog').addClass('modal-sm');
        $modal.find('h3').text('选择上级地区');
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
        this.api.districtMgr.create(this.district).then(data => {
          MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

          $vue.$emit('refresh');
          this.reback();
        });
      },
      update() {
        let $vue = this;
        this.api.districtMgr.update(this.district).then(data => {
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