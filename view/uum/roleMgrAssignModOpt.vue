<template>
<div>
  <form class="form-horizontal">
    <div class="form-group">
      <label class="control-label col-sm-4 col-md-2">角色名称:</label>
      <div class="col-sm-4 col-md-2"><p class="form-control-static">{{ roleName }}</p></div>
    </div>
  </form>
  
  <ul class="nav nav-tabs">
    <li class="active"><a href="#role_assign_mod_opt" role="tab" data-toggle="tab">模块操作权限分配</a></li>
    <li><a href="#role_assign_row_priv" role="tab" data-toggle="tab">行权限分配</a></li>
  </ul>

  <div class="tab-content">
    <div class="tab-pane fade in active" id="role_assign_mod_opt" role="tabpanel">
      <strong>权限范围</strong>
      <form class="form-inline">
        <label><input type="radio" name="priScope" value="inc" v-model="privilegeScope"> 包含操作</label>
        <label><input type="radio" name="priScope" value="exc" v-model="privilegeScope"> 不包含操作</label>
        <label><input type="radio" name="priScope" value="all" v-model="privilegeScope"> 全部(无需分配操作)</label>
      </form>
      <table>
        <tr>
          <td>
            <div class="select-side">
              <br/>
              <span>未选模块</span>
              <div class="select-side-body">
                <ul id="left_tree" class="ztree"></ul>
              </div>
            </div>
          </td>
          <td>
            <div class="select-opt">
              <p class="to-right" title="添加" @click="selUnselOpt(leftTreeObj, rightTreeObj)">&lt;&lt;</p>
              <p class="to-left" title="移除" @click="selUnselOpt(rightTreeObj, leftTreeObj)">&gt;&gt;</p>
            </div>
          </td>
          <td>
            <div class="select-side">
              <br/>
              <span>已选模块</span>
              <div class="select-side-body">
                <ul id="right_tree" class="ztree"></ul>
              </div>
            </div>
          </td>
        </tr>
      </table>
      <div class="panel-footer">
        <button type="button" class="btn btn-default btn-sm" @click="config.view = ''">返回</button>
        <button type="button" class="btn btn-primary btn-sm" @click="saveOperationPrivilege">保存</button>
      </div>
    </div>

    <div class="tab-pane fade" id="role_assign_row_priv" role="tabpanel">
      <form class="form-inline">
        <label><input type="radio" name="rolPri" value="org" v-model="rowPrivilege"> 机构</label>
        <label><input type="radio" name="rolPri" value="rol" v-model="rowPrivilege"> 角色</label>
        <label><input type="radio" name="rolPri" value="urs" v-model="rowPrivilege"> 用户</label>
      </form>
      <div class="panel-footer">
        <button type="button" class="btn btn-default btn-sm" @click="config.view = ''">返回</button>
        <button type="button" class="btn btn-primary btn-sm" @click="saveRowPrivilege">保存</button>
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
  data() {
    return {
      roleId: this.config.role.roleId,
      roleName: this.config.role.roleName,
      privilegeScope: null,
      rowPrivilege: null,
      leftTreeObj: null,
      rightTreeObj: null
    }
  },
  mounted() {
    let $vue = this;
    let setting1 = {
      check : { enable : true },
      data : {
        key : { name : 'text' },
        simpleData : { enable : true, pIdKey : 'parentId', rootPId : null }
      },
      callback : {
        onCheck : function(event, treeId, treeNode) {
          if(treeNode.checked) {
            $vue.leftTreeObj.expandNode(treeNode, true, true, true);
          }
        }
      }
    };
    let setting2 = {
      check : { enable : true },
      data : {
        key : { name : 'text' },
        simpleData : { enable : true, pIdKey : 'parentId', rootPId : null }
      },
      callback : {
        onCheck : function(event, treeId, treeNode) {
          if(treeNode.checked) {
            $vue.rightTreeObj.expandNode(treeNode, true, true, true);
          }
        }
      }
    };

    let role = this.config.role;
    this.api.roleMgr.listRowPrivilege({id :  role.roleId, roleName : role.roleName}).then(data => {
      $vue.rowPrivilege = data.rowPrivilege;
      $vue.privilegeScope = data.privilegeScope;
      $vue.leftTreeObj = $.fn.zTree.init($($vue.$el).find('#left_tree'), setting1, data.unassign);
      $vue.rightTreeObj = $.fn.zTree.init($($vue.$el).find('#right_tree'), setting2, data.assign);
    });
  },
  methods: {
    /**
    * 删除结点
    * @param  delNode 结点对象
    */
    deleteNode(delNode, treeObj) {
      if (delNode != null) {
        var parentNode = delNode.getParentNode();
        if (delNode.leaf) {
          treeObj.checkNode(delNode, false, true);
          treeObj.removeNode(delNode);
        } else if (!delNode.children || delNode.children.length == 0) {
          treeObj.checkNode(delNode, false, true);
          treeObj.removeNode(delNode);
        }
        if(parentNode && parentNode.children.length == 0) {
          this.deleteNode(parentNode, treeObj);
        }
      }
    },
    /**
    *移动增加结点
    *
    *@param node 节点
    *@param fromTree 源树
    *@param toTree 目标树
    */
    moveNode(node, fromTree, toTree) {
      var obj = toTree.getNodeByParam('id', node.id);
      if (obj == null) {
        var parentNode = toTree.getNodeByParam('id', node.parentId, null);
        var newNode = {
          id : node.id,
          parentId : node.parentId,
          text : node.text,
          iconSkin : node.iconSkin,
          isParent : node.isParent,
          checked : false
        }
        if (parentNode) {
          toTree.addNodes(parentNode, newNode);
        } else {
          toTree.addNodes(null, newNode);
        }
      }
    },
    /**
     * 取消、分配操作
     */
    selUnselOpt(fromTree, toTree) {
      var checkedNodes = fromTree.getCheckedNodes(true);
      if(checkedNodes.length == 0) {
        MyCuckoo.alertMsg({ title : '提示', msg : '请选择相应的模块操作!' });
        return;
      }
      for (var i = 0; i < checkedNodes.length; i++) {
        this.moveNode(checkedNodes[i], fromTree, toTree);
        this.deleteNode(checkedNodes[i], fromTree);
      }
    },
    //保存用户权限
    saveOperationPrivilege() {
      if(!this.privilegeScope) {
        MyCuckoo.alertMsg({ title : '提示', msg : '请选择权限范围!' });
        return;
      }

      let selectedNodes = this.rightTreeObj.getNodesByFilter(function(node) {
        if(!node.isParent) return true;
        return false;
      });

      let optIds = [];
      selectedNodes.forEach(item => optIds.push(Number(item.id) - 1000));

      let params = {
        id: this.config.role.roleId,
        privilegeScope: this.privilegeScope,
        operationIds: optIds.join(',')
      }
      this.api.roleMgr.saveOperationPrivilege(params).then(data => {
        MyCuckoo.msg({state: 'success', title: '提示', msg: data});
      });
    },
    //保存行权限
    saveRowPrivilege() {
      if(!this.rowPrivilege) {
        MyCuckoo.alertMsg({ title : '提示', msg : '请选择行权限类别!' });
        return;
      }

      let params = {
        id: this.config.role.roleId,
        rowPrivilege: this.rowPrivilege
      }
      this.api.roleMgr.saveRowPrivilege(params).then(data => {
        MyCuckoo.msg({state: 'success', title: '提示', msg: data});
      });
    }
    //end
  }
}
</script>