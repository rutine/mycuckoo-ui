<template>
<div>
  <form class="form-horizontal">
    <input type="hidden" name="defaultRoleId" :value="defaultRoleId"/>
    <div class="form-group">
      <label class="control-label col-md-2">用户名称:</label>
      <div class="col-md-4"><p class="form-control-static">{{ userName }}</p></div>
      <label class="control-label col-md-2">默认角色:</label>
      <div class="col-md-4"><p class="form-control-static defaultRoleName">{{ defaultRoleName }}</p></div>
    </div>
  </form>
  <ul class="nav nav-tabs">
    <li class="active"><a href="javascript:usr-assign-mod-opt">用户分配角色</a></li>
  </ul>

  <div class="tab-content">
    <div class="tab-pane active" id="usr-assign-mod-opt">
      <table>
        <tr>
          <td>
            <div class="select-side">
              <span>未选角色</span>
              <div style="width: 200px; height:200px; border: 1px solid #0088CC; overflow-y: auto;">
                <ul id="left_role_tree" class="ztree"></ul>
              </div>
            </div>
          </td>
          <td>
            <div class="select-opt">
              <p class="to-right" title="添加" @click="selected">&lt;&lt;</p>
              <p class="to-left" title="移除" @click="unselected">&gt;&gt;</p>
            </div>
          </td>
          <td>
            <div class="select-side">
              <span>已选角色</span>
              <select id="right_role_multi_select" name="roles" multiple="multiple" v-model="selectData">
                <option v-for="role in roleUserRefs" :value="role.orgRoleId">
                  {{ role.organName != '' ? role.organName + '-' + role.roleName : role.roleName }}
                </option>
              </select>
            </div>
          </td>
        </tr>
      </table>
      <div class="panel-footer">
        <button type="button" class="btn btn-default btn-sm" @click="config.view = ''">返回</button>
        <button type="button" class="btn btn-default btn-sm" @click="setDefaultRole">默认角色</button>
        <button type="button" class="btn btn-primary btn-sm">保存</button>
      </div>
    </div>
  </div>
</div>
</template>
<script>
  export default {
    props: {
      config: Object
    },
    data () {
      return {
        defaultRoleId: this.config.user.orgRoleId,
        defaultRoleName: this.config.user.orgName + '-' + this.config.user.roleName,
        userId: this.config.user.userId,
        userName: this.config.user.userName,
        orgRoles: [],
        roleUserRefs: [],
        selectData: [],
        zTree: null
      }
    },
    mounted() {
      let $vue = this;
      let setting = {
        async : { enable : false},
        check : { enable : true },
        data : {
          key : { name : 'text' },
          simpleData : { enable : true, pIdKey : 'parentId', rootPId : null }
        },
        callback : {
          beforeExpand : function(treeId, treeNode) {
            !treeNode.loaded && $vue.api.userMgr.getChildNodes({
              treeId: treeNode.id,
              isCheckbox: 'Y'
            }).then(data => {
              treeNode.loaded = true;
              $vue.zTree.addNodes(treeNode, data, true);
            });
          },
          onCheck : function(event, treeId, treeNode) {
            if(treeNode.checked) {
              $vue.zTree.expandNode(treeNode, true, true, true);
            }
          }
        }
      };

      this.api.userMgr.listRolePrivilege({id: this.config.user.userId}).then(data => {
        this.orgRoles = data.orgRoles;
        this.roleUserRefs = data.roleUserRefs;
        this.zTree =  $.fn.zTree.init($(this.$el).find('#left_role_tree'), setting, this.orgRoles);
      });
    },
    created() {

    },
    methods: {

      /**
      * 选择添加角色
      *
      * @param 多选角色框
      * @param 机构角色树
      */
      selected() {
        let multiSelectObj = this.selectData;
        let treeObj = this.zTree;

        let checkedNodes = treeObj.getCheckedNodes(true);
        if(checkedNodes.length == 0) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请您选择相应角色!' });
          return;
        }

        for (let i = 0; i < checkedNodes.length; i++) {
          let checkedNode = checkedNodes[i];
          let parentNode = checkedNode.getParentNode();
          let orgRoleId = checkedNode.id;
          let roleId = orgRoleId.substr(0, orgRoleId.indexOf('_'));
          this.roleUserRefs.forEach(function(item) {
            if(item.orgRoleId == roleId) {

            }
          });

          let exist = false;
          for(let index in this.roleUserRefs) {
            exist = this.roleUserRefs[index].orgRoleId == roleId;
          }
          if(!exist) {
            this.roleUserRefs.push({
              orgRoleId: roleId,
              organName: parentNode ? parentNode.text : '',
              roleName: checkedNode.text
            });
          }
        }

        if(this.roleUserRefs.length == 1) {
          this.defaultRoleId = this.roleUserRefs[0].roleId;
          this.defaultRoleName = this.roleUserRefs[0].organName != ''
              ? this.roleUserRefs[0].organName + '-' + this.roleUserRefs[0].roleName
              : this.roleUserRefs[0].roleName;
        }
      },
      /**
      * 选择移除角色
      *
      * @param 多选角色框
      * @param 机构角色树
      */
      unselected() {
        let multiSelectObj = this.selectData;
        let treeObj = this.zTree;
        let $vue = this;

        if (!multiSelectObj.length) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请您选择角色列表!' });
          return;
        }

        let defaultRoleId = this.defaultRoleId;

        multiSelectObj.forEach(function(item, index) {
          let node = treeObj.getNodeByParam('id', item + '_2');
          if(node) {
            treeObj.checkNode(node, true);
            if(defaultRoleId == item) {
              $vue.defaultRoleId = '';
              $vue.defaultRoleName = '';
            }

            delete multiSelectObj[index];
          }
        });


        if(this.roleUserRefs.length == 1) {
          this.defaultRoleId = this.roleUserRefs[0].roleId;
          this.defaultRoleName = this.roleUserRefs[0].organName != ''
              ? this.roleUserRefs[0].organName + '-' + this.roleUserRefs[0].roleName
              : this.roleUserRefs[0].roleName;
        } else {
          this.defaultRoleId = '';
          this.defaultRoleName = '';
        }
      },
      //设置默认角色
      setDefaultRole() {
        if(this.selectData.length != 1) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请您在右边列表选择一个角色!' });
          return;
        }

        let $vue = this;
        this.roleUserRefs.forEach(function(item) {
          if(item.orgRoleId == $vue.selectData[0]) {
            $vue.defaultRoleId = item.roleId;
            $vue.defaultRoleName = item.organName != ''
                ? item.organName + '-' + item.roleName
                : item.roleName;
          }
        });
      },
      //保存角色
      save() {
        if(!this.defaultRoleId) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请为用户选择一个默认角色!' });
        } else if(!this.roleUserRefs.length) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请为用户分配一个角色!' });
        } else {
          let roleIdList = [];
          for(let index in this.roleUserRefs) {
            roleIdList.push(this.roleUserRefs[index].orgRoleId);
          }

          let params = {
            id: this.config.userId,
            defaultRoleId: this.defaultRoleId,
            roleIdList: roleIdList.join(',')
          }

          this.api.userMgr.saveRolePrivilege(params).then(data => {
            MyCuckoo.showMsg({state:'success', title: '提示', msg: data.message});
          });
        }
      }

    }
  }
</script>