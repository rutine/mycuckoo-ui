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
              <div class="select-side-body">
                <ul id="left_role_tree" class="ztree"></ul>
              </div>
            </div>
          </td>
          <td>
            <div class="select-opt">
              <p class="to-right" title="添加" @click="selected(roleUserRefs, zTree)">&lt;&lt;</p>
              <p class="to-left" title="移除" @click="unselected(roleUserRefs, zTree)">&gt;&gt;</p>
            </div>
          </td>
          <td>
            <div class="select-side">
              <span>已选角色</span>
              <select id="right_role_multi_select" name="roles" class="select-side-body"
                      multiple="multiple" v-model="selectData">
                <option v-for="role in roleUserRefs" :value="role">
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
        <button type="button" class="btn btn-primary btn-sm" @click="save">保存</button>
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
            !treeNode.loaded
            && $vue.api.userMgr.getChildNodes({treeId: treeNode.id, isCheckbox: 'Y'}).then(data => {
              treeNode.loaded = true;
              let newNodes = $vue.zTree.addNodes(treeNode, data, true, true);
              newNodes.forEach(node => node.isParent && $vue.zTree.expandNode(node, true, false, false, true));
            });
          }
        }
      };


      $vue.api.userMgr.listRolePrivilege({id: this.config.user.userId}).then(data => {
        $vue.orgRoles = data.orgRoles;
        $vue.roleUserRefs = data.roleUserRefs;
        $vue.zTree =  $.fn.zTree.init($(this.$el).find('#left_role_tree'), setting, this.orgRoles);

        //展开所有
        $vue.zTree.getNodes().forEach(node => {
          $vue.zTree.expandNode(node, true, false, false, true);
        })
      });
    },
    methods: {

      /**
      * 选择添加角色
      *
      * @param 多选角色框
      * @param 机构角色树
      */
      selected(multiSelectObj, treeObj) {
        let checkedNodes = treeObj.getCheckedNodes(true);
        if(checkedNodes.length == 0) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请您选择相应角色!' });
          return;
        }

        for (let i = 0; i < checkedNodes.length; i++) {
          let checkedNode = checkedNodes[i];
          let parentNode = checkedNode.getParentNode();
          let orgRoleId = checkedNode.id.substr(checkedNode.id.indexOf('_') + 1);


          let exist = false;
          for(let index in multiSelectObj) {
            exist = exist || multiSelectObj[index].orgRoleId == orgRoleId;
          }
          if(!exist) {
            multiSelectObj.push({
              orgRoleId: orgRoleId,
              organName: parentNode ? parentNode.text : '',
              roleName: checkedNode.text
            });
          }
        }

        if(multiSelectObj.length == 1) {
          this.defaultRoleId = multiSelectObj[0].orgRoleId;
          this.defaultRoleName = multiSelectObj[0].organName != ''
              ? multiSelectObj[0].organName + '-' + multiSelectObj[0].roleName
              : multiSelectObj[0].roleName;
        }
      },
      /**
      * 选择移除角色
      *
      * @param 多选角色框
      * @param 机构角色树
      */
      unselected(multiSelectObj, treeObj) {
        if (!this.selectData.length) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请您选择角色列表!' });
          return;
        }

        let defaultRoleId = this.defaultRoleId;

        for(let index in this.selectData) {
          let item = this.selectData[index];
          let node = treeObj.getNodeByParam('id', 'orgRoleId_' + item.orgRoleId);
          if(node) {
            treeObj.checkNode(node, true);
            if(defaultRoleId == item) {
              this.defaultRoleId = '';
              this.defaultRoleName = '';
            }
          }

          multiSelectObj.forEach((item2, index) => {
            if(item2.orgRoleId == item.orgRoleId) {
              multiSelectObj.splice(index, 1);
            }
          });
        }

        this.selectData = [];

        if(multiSelectObj.length == 1) {
          this.defaultRoleId = multiSelectObj[0].orgRoleId;
          this.defaultRoleName = multiSelectObj[0].organName != ''
              ? multiSelectObj[0].organName + '-' + multiSelectObj[0].roleName
              : multiSelectObj[0].roleName;
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

        let item = this.selectData[0];
        this.defaultRoleId = item.orgRoleId;
        this.defaultRoleName = item.organName != ''
            ? item.organName + '-' + item.roleName
            : item.roleName;
      },
      //保存角色
      save() {
        if(!this.defaultRoleId) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请为用户选择一个默认角色!' });
        } else if(!this.roleUserRefs.length) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请为用户分配一个角色!' });
        } else {
          let roleIds = [];
          this.roleUserRefs.forEach(item => roleIds.push(item.orgRoleId));

          let params = {
            id: this.userId,
            defaultRoleId: this.defaultRoleId,
            roleIds: roleIds.join(',')
          }

          this.api.userMgr.saveRolePrivilege(params).then(data => {
            MyCuckoo.msg({state:'success', title: '提示', msg: data});
          });
        }
      }
      //end

    }
  }
</script>