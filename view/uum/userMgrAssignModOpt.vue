<template>
<div>
  <form class="form-horizontal">
    <div class="form-group">
      <label class="control-label col-md-2">用户名称:</label>
      <div class="col-md-4"><p class="form-control-static">{{ userName }}</p></div>
    </div>
  </form>
  <ul class="nav nav-tabs">
    <li class="active"><a href="#usr_assign_mod_opt" role="tab" data-toggle="tab">模块操作权限分配</a></li>
    <li><a href="#usr_assign_row_priv" role="tab" data-toggle="tab">行权限分配</a></li>
  </ul>

  <div class="tab-content">
    <div class="tab-pane fade in active" id="usr_assign_mod_opt" role="tabpanel">
      <form class="form-inline">
        <strong>权限范围:&nbsp;</strong>
        <label class="radio-inline"><input type="radio" name="priScope" value="inc" v-model="privilegeScope"> 包含操作</label>
        <label class="radio-inline"><input type="radio" name="priScope" value="exc" v-model="privilegeScope"> 不包含操作</label>
        <label class="radio-inline"><input type="radio" name="priScope" value="all" v-model="privilegeScope"> 全部(无需分配操作)</label>
      </form>
      <table>
        <tr>
          <td>
            <div class="select-side">
              <br/>
              <span>未选模块</span>
              <div class="select-side-body">
                <ul id="left_user_tree" class="ztree"></ul>
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
                <ul id="right_user_tree" class="ztree"></ul>
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

    <div class="tab-pane fade" id="usr_assign_row_priv" role="tabpanel">
      <form class="form-inline">
        <label class="radio-inline"><input type="radio" name="rowPri" value="org" v-model="rowPrivilege"> 机构</label>
        <label class="radio-inline"><input type="radio" name="rowPri" value="rol" v-model="rowPrivilege"> 角色</label>
        <label class="radio-inline"><input type="radio" name="rowPri" value="usr" v-model="rowPrivilege"> 用户</label>
        <label class="searchUsr" v-show="showSearchUsr">
          <input type="text" placeholder="用户名称" v-model="searchUsr" @keyup.enter="queryUsers">
          <span class="btn btn-warning btn-sm" @click="queryUsers">
            <span class="glyphicon glyphicon-search"></span>
          </span>
        </label>
      </form>
      <table>
        <tr>
          <td>
            <div class="select-side">
              <br/>
              <span v-if="rowPrivilege == 'rol'">选择角色</span>
              <span v-else-if="rowPrivilege == 'urs'">选择用户</span>
              <span v-else="">选择机构</span>
              <span>
              </span>
              <div class="select-side-body">
                <ul id="left_row_tree" class="ztree"></ul>
              </div>
            </div>
          </td>
        </tr>
      </table>
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
    data () {
      return {
        userId: this.config.user.userId,
        userName: this.config.user.userName,
        privilegeScope: null,
        rowPrivilege: null,
        showSearchUsr: false,
        searchUsr: null,
        leftTreeObj: null,
        rightTreeObj: null,
        rowTreeObj: null
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

      let user = this.config.user;
      this.api.userMgr.listUserPrivilege({id :  user.userId, userName : user.userName}).then(data => {
        $vue.rowPrivilege = data.rowPrivilege;
        $vue.privilegeScope = data.privilegeScope;
        $vue.leftTreeObj = $.fn.zTree.init($($vue.$el).find('#left_user_tree'), setting1, data.unassign);
        $vue.rightTreeObj = $.fn.zTree.init($($vue.$el).find('#right_user_tree'), setting2, data.assign);
      });

      this.selectRowPrivilege(this.rowTreeObj, this.userId, '');
    },
    watch: {
      rowPrivilege: function (newVal, oldVal) {
        this.selectRowPrivilege(this.rowTreeObj, this.userId, newVal);
      }
    },
    methods: {
      /**
      * 删除结点
      * @param delNode 结点对象
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

      /**
      * 行权限改变事件
      *
      * @param treeObj 树对象
      * @param privilegeType 权限类型
      * @param initBol 是否进行初始化
      */
      selectRowPrivilege(treeObj, userId, privilegeType) {
        let $vue = this;
        let treeId = $(this.$el).find('#left_row_tree');

        $vue.api.userMgr.listRowPrivilege({id : userId}).then(data => {
          let privilegeTypeSelected = data.rowPrivilege;
          $vue.showSearchUsr = false;

          if(!privilegeType) {
            $vue.rowPrivilege = privilegeTypeSelected || 'org';
            privilegeType = privilegeTypeSelected || 'org';
          }

          function checked(nodes) {//设置选中
            if(privilegeType != privilegeTypeSelected) return;
            data.row.forEach(item => {
              nodes.forEach(node => {
                let index = !isNaN(node.id) ? -1 : node.id.indexOf('_');
                let id = index != -1 ? node.id.substr(index + 1) : node.id;
                if (item.id == id) {
                  treeObj.checkNode(node, true);
                }
              });
            });
          }

          if(privilegeType == 'org') {
            let setting = {
              check : { enable : true },
              data : { key : { name : 'text', icon : 'iconCls' } },
              view : {
                dblClickExpand : false, showLine : true, selectedMulti : false
              },
              callback : {
                beforeExpand : function(treeId, treeNode) {
                  ($vue.rowPrivilege == privilegeType)
                  && !treeNode.loaded
                  && $vue.api.organMgr.getChildNodes({treeId: treeNode.id}).then(data => {
                    treeNode.loaded = true;
                    let newNodes = treeObj.addNodes(treeNode.id ? treeNode : null, data, true, true);
                    newNodes.forEach(node => node.isParent && treeObj.expandNode(node, true, false, false, true));
                    checked(newNodes);
                  });
                }
              },
            }

            $vue.rowTreeObj = treeObj = $.fn.zTree.init(treeId, setting);
            setting.callback.beforeExpand(null, {});
          } else if(privilegeType == 'rol') {
            var setting = {
              check : { enable : true },
              data : { key : { name : 'text', icon : 'iconCls' } },
              view : {
                dblClickExpand : false, showLine : true, selectedMulti : false
              },
              callback : {
                beforeExpand : function(treeId, treeNode) {
                  ($vue.rowPrivilege == privilegeType)
                  && !treeNode.loaded
                  && $vue.api.userMgr.getChildNodes({treeId: treeNode.id, isCheckbox: 'Y'}).then(data => {
                    treeNode.loaded = true;
                    let newNodes = treeObj.addNodes(treeNode.id ? treeNode : null, data, true, true);
                    newNodes.forEach(node => node.isParent && treeObj.expandNode(node, true, true, true, true));
                    checked(newNodes);
                  });
                }
              },
            }

            $vue.rowTreeObj = treeObj = $.fn.zTree.init(treeId, setting);
            setting.callback.beforeExpand(null, {});
          } else {
            var setting = {
              check : { enable : true },
              view : {
                dblClickExpand: function(treeId, treeNode) {
                  return treeNode.level > 0;
                }
              },
              callback : {
                onCheck : function(event, treeId, treeNode) {
                  if(treeNode.checked) {
                    treeObj.expandNode(treeNode, true, true, true);
                  }
                }
              }
            }
            $vue.showSearchUsr = true;

            if(privilegeType != privilegeTypeSelected) {
              $vue.rowTreeObj = treeObj = $.fn.zTree.init(treeId, setting);
            } else {
              data.row.forEach(item => {
                item.checked = true;
              });

              $vue.rowTreeObj = treeObj = $.fn.zTree.init(treeId, setting, data.row);
            }
          }
        });
      },
      //查询用户
      queryUsers() {
        let $vue = this;

        while($vue.rowTreeObj.getNodes().length) {
          $vue.rowTreeObj.getNodes().forEach(item => this.deleteNode(item, $vue.rowTreeObj));
        }

        $vue.api.userMgr.queryUsers({userName : this.searchUsr}).then(data => {
          let nodes = [];
          data.forEach(item => nodes.push({id: item.userId, text: item.userName, name: item.userName, isParent: false, parentId: -1}));

          $vue.rowTreeObj.addNodes(null, nodes);
        });
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
          id: this.config.user.userId,
          privilegeScope: this.privilegeScope,
          operationIds: optIds.join(',')
        }
        this.api.userMgr.saveOperationPrivilege(params).then(data => {
          MyCuckoo.msg({state: 'success', title: '提示', msg: data});
        });
      },
      //保存行权限
      saveRowPrivilege() {
        if(!this.rowPrivilege) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请选择行权限类别!' });
          return;
        }

        let checkedNodes = this.rowTreeObj.getCheckedNodes(true);
        if(checkedNodes.length == 0) {
          MyCuckoo.alertMsg({ title : '提示', msg : '请您选择行权限!' });
          return;
        }

        let $vue = this;
        let rowIds = [];
        checkedNodes.forEach(node => {
          let index = !isNaN(node.id) ? -1 : node.id.indexOf('_');
          rowIds.push(index != -1 ? node.id.substr(index + 1) : node.id);
        });

        let params = {
          id: this.config.user.userId,
          rowPrivilege: this.rowPrivilege,
          rowIds: rowIds.join(',')
        }
        this.api.userMgr.saveRowPrivilege(params).then(data => {
          MyCuckoo.msg({state: 'success', title: '提示', msg: data});
        });
      }
      //end

    }
  }
</script>