<template>
  <div class="row">
    <div v-show="!config.view" >
    <div class="col-sm-3 col-md-2 mycuckoo-sidebar">
      <ul class="nav">
        <li style="font-size:13px">
          <strong>机构角色树</strong>
        </li>
        <li><ul id="tree_user" class="ztree"></ul></li>
      </ul>
    </div>
    
    <div class="col-sm-9 col-md-10 mycuckoo-submain">

      <!-- 查询表单 -->
      <div class="page-header">
        <form class="form-inline" name="searchForm">
          <div class="form-group">
            <label class="sr-only">用户号</label>
            <input type="text" class="form-control input-sm" v-model="param.userCode" placeholder=用户号 />
          </div>
          <div class="form-group">
            <label class="sr-only">用户名</label>
            <input type="text" class="form-control input-sm" v-model="param.userName" placeholder=用户名 />
          </div>
          <button type="button" class="btn btn-info btn-sm" name="search" @click="list">查询
            <span class="glyphicon glyphicon-search"></span>
          </button>
          <button type="button" class="btn btn-default btn-sm" name="clear" @click="clear">&nbsp;清空
            <span class="glyphicon glyphicon-repeat"></span>
          </button>
        </form>
      </div>

      <!-- 模块操作按钮 -->
      <toolbar name="moduleOpt" :value="menu.fourth[$route.params.moduleId]" v-on:operator="operator"></toolbar>

      <!-- 内容列表 -->
      <table class="table table-striped table-hover table-condensed">
        <tr>
          <th><input type="checkbox" name="all" @click="selectAll"/></th>
          <th>序号</th>
          <th>用户号</th>
          <th>用户名</th>
          <th class="hidden">密码</th>
          <th>性别</th>
          <th>职位</th>
          <th class="hidden">用户照片(单击照片删除)</th>
          <th class="hidden">选择照片</th>
          <th>用户QQ</th>
          <th class="hidden">用户MSN</th>
          <th>用户手机</th>
          <th class="hidden">用户手机2</th>
          <th class="hidden">办公电话</th>
          <th class="hidden">家庭电话</th>
          <th class="hidden">家庭住址</th>
          <th>用户邮件</th>
          <th class="hidden">用户有效期</th>
          <th>所属机构</th>
          <th>所属角色</th>
          <th>用户状态</th>
          <th class="hidden">备注</th>
          <th>创建人</th>
          <th>创建日期</th>
        </tr>
        <tr v-for="(user, index) in page.content">
          <td><input type="checkbox" name="single" v-model="selectData" :value="user.userId"/></td>
          <td>{{ index + 1 }}</td>
          <td>{{ user.userCode }}</td>
          <td>{{ user.userName }}</td>
          <td class="hidden"></td>
          <td><selector name="gender" :value="user.userGender"></selector></td>
          <td>{{ user.userPosition }}</td>
          <td class="hidden"></td>
          <td class="hidden"></td>
          <td>{{ user.userQq }}</td>
          <td class="hidden"></td>
          <td>{{ user.userMobile }}</td>
          <td class="hidden"></td>
          <td class="hidden"></td>
          <td class="hidden"></td>
          <td class="hidden"></td>
          <td>{{ user.userEmail }}</td>
          <td class="hidden"></td>
          <td>{{ user.orgName }}</td>
          <td>{{ user.roleName }}</td>
          <td><selector name="status" :value="user.status"></selector></td>
          <td class="hidden"></td>
          <td>{{ user.creator }}</td>
          <td>{{ user.createDate }}</td>
        </tr>
      </table>

      <!-- 分页 -->
      <pagination :page="page" v-on:selectPage="selectPage"></pagination>
    </div>
    </div>

    <component :is="config.view" :config="config" @refresh="list"></component>
  </div>
</template>
<script>
import mgrForm from './userMgrForm.vue';
import roleForm from './userMgrAssignRole.vue';

export default {
  data () {
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
        treeId: null,
        userCode: null,
        userName: null,
        pageNo: 1,
        pageSize: 10
      },
      selectData: [],
      config: {}
    }
  },
  mounted() {
    let $vue = this;
    let setting = {
      check : { enable : false},
      callback : {
        onClick : function(event, treeId, treeNode) {
          $vue.param.treeId = treeNode.id;
          $vue.list();
        },
        beforeExpand : function(treeId, treeNode) {
          !treeNode.loaded && $vue.api.userMgr.getChildNodes({ treeId: treeNode.id }).then(data => {
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
    };

    let zTree = null;
    $vue.api.userMgr.getChildNodes(null).then(data => {
      zTree = $.fn.zTree.init($('#tree_user'), setting, data);
    });

    $vue.list();
  },
  components: {
    mgrForm: mgrForm,
    roleForm: roleForm
  },
  methods: {
    //列表
    list() {
      let $vue = this;
      $vue.api.userMgr.list($vue.param).then(data => {
        $vue.page = data;
      });
    },
    //清理查询
    clear() {
      for(let p in this.param) {
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
          $vue.selectData.push(i);
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
    //操作
    operator(fn) {
      eval('this.' + fn + '()');
    },
    //增加
    add() {
      this.config = {
        view: 'mgrForm',
        action: 'create'
      }
    },
    //修改
    modify() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'update',
        id: this.selectData[0]
      }
    },
    //查看
    view() {
      this.checkSelect();

      this.config = {
        view: 'mgrForm',
        action: 'view',
        id: this.selectData[0]
      }
    },
    //删除
    delete() {
      this.checkSelect();

      let $vue = this;
      MyCuckoo.showDialog({
        title: '警告提示',
        msg: '您确认删除此记录吗?',
        okBtn: '是',
        cancelBtn: '否',
        ok: function() {
          this.api.userMgr.del({id: this.selectData[0]}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: data.message});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
    //启用
    enable() {
      this.checkSelect();

      let $vue = this;
      for(let index in $vue.page.content) {
        let item = $vue.page.content[index];
        if($vue.selectData[0] == item.userId && item.status == 'enable') {
          MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此用户已经启用' });
          return;
        }
      }

      $vue.api.userMgr.disEnable({id: $vue.selectData[0], disEnableFlag: 'enable'}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '用户停用成功!此用户将不能在使用本系统。'});

        $vue.list(); // 刷新列表
      });
    },
    //停用
    disable() {
      this.checkSelect();

      let $vue = this;
      for(let index in $vue.page.content) {
        let item = $vue.page.content[index];
        if($vue.selectData[0] == item.userId && item.status == 'disable') {
          MyCuckoo.showMsg({ state: 'info', title : '提示', msg : '此用户已经停用' });
          return;
        }
      }

      MyCuckoo.showDialog({
        msg : '您确认停用此用户?如停用,此用户将归入无角色用户并自动清除所有权限。',
        okBtn: '是',
        cancelBtn: '否',
        ok : function() {
          $vue.api.userMgr.disEnable({id: $vue.selectData[0], disEnableFlag: 'disable'}).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: '用户启用成功'});

            $vue.list(); // 刷新列表
          });
        }
      });
    },
    //重置密码
    resetpwd() {
      this.checkSelect();

      let $vue = this;
      let userName = '';
      for(let index in $vue.page.content) {
        let item = $vue.page.content[index];
        if($vue.selectData[0] == item.userId) {
          userName = item.userName;
        }
      }

      $vue.api.userMgr.resetPwd({id: $vue.selectData[0], userName: userName}).then(data => {
        MyCuckoo.showMsg({state: 'success', title: '提示', msg: '用户启用成功'});

        $vue.list(); // 刷新列表
      });
    },
    //分配角色
    assignrole() {
      this.checkSelect();

      let $vue = this;
      let user = null;
      for(let index in $vue.page.content) {
        let item = $vue.page.content[index];
        if ($vue.selectData[0] == item.userId) {
          user = item;
          if(item.status == 'disable') {
            MyCuckoo.showMsg({state: 'info', title: '提示', msg: '请先启用此用户'});
            return;
          }
        }
      }

      this.config = {
        view: 'roleForm',
        user: user
      }
    }

  }
}

    /*jQuery(function($) {
      var config = {};
      var $main = $('.mycuckoo-submain');

      // 操作按钮
        $main.off('click', '.btn-toolbar .btn-group .btn');
        $main.on('click', '.btn-toolbar .btn-group .btn', function(event) {
          event.preventDefault();
          var opt = $(this).attr('href'); // modId = 53
          switch(opt) {
          case BasicConstant.OPT_OPTPRI_LINK:
            assignPriv();
            break;
          case 'assignrole':
            assignRole();
            break;
          }
        });
      
      // 分配特殊权限
      function assignPriv() {
        var $singleCheck = $main.find('.table input:checked[name=single]');
        if ($singleCheck.size() != 1) {
          MyCuckoo.showMsg({ state: 'warning', title : '提示', msg : '请选择一条件记录!' });
          return;
        }
        var _jsonObj = $.parseJSON($singleCheck.next(':first').html());
        if (BasicConstant.OPT_DISABLE_LINK == _jsonObj.status) {
          MyCuckoo.showMsg({ state : 'danger', title : '提示', msg : '请先启用此用户！' });
          return;
        } else if(_jsonObj.uumOrgRoleId == 0) {
          MyCuckoo.showMsg({ state : 'danger', title : '提示', msg : '请先为此用户分配有效角色！' });
          return;
        }
        
        /!**
         * 删除结点
         * @param delNode 结点对象
         *!/
        var deleteNode = function(delNode, treeObj) {
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
              deleteNode(parentNode, treeObj);
            }
          }
        };
        /!**
         *移动增加结点 
         *
         *@param node 节点
         *@param fromTree 源树
         *@param toTree 目标树
         *!/
        var moveNode = function(node, fromTree, toTree) {
          var obj = toTree.getNodeByParam('id', node.id);
          if (obj == null) {
            var parentNode = toTree.getNodeByParam('id', node.parentId, null);
            var newNode = {id : node.id, parentId : node.parentId, text : node.text, iconSkin : node.iconSkin, isParent : node.isParent, checked : false };
            if (parentNode) {
              toTree.addNodes(parentNode, newNode);
            } else {
              toTree.addNodes(null, newNode);
            }
          }
        };
        /!**
         * 取消、分配操作
         *!/
        var selUnselOpt = function(fromTree, toTree) {
          var checkedNodes = fromTree.getCheckedNodes(true);
          if(checkedNodes.length == 0) {
            MyCuckoo.alertMsg({ title : '提示', msg : '请选择相应的模块操作!' });
            return;
          }
          for (var i = 0; i < checkedNodes.length; i++) {
            moveNode(checkedNodes[i], fromTree, toTree);
            deleteNode(checkedNodes[i], fromTree);
          }
        };
        
        /!**
         * 选择添加机构、角色或用户
         * 
         * @param multiselectObj 多选机构、角色或用户框
         * @param treeObj 机构、机构角色或用户树
         *!/
        var selected = function(multiselectObj, treeObj) {
          var $checked = multiselectObj.parents('div.tab-pane').find(':radio[name=rowPri]:checked');
          var checkedNodes = treeObj.getCheckedNodes(true);
          if(checkedNodes.length == 0) {
            MyCuckoo.alertMsg({ title : '提示', msg : '请选择左边列表!' });
            return;
          }
          if($checked.val() == 'rol') {
            for (var i = 0; i < checkedNodes.length; i++) {
              var checkedNode = checkedNodes[i];
              var orgRoleId = checkedNode.id;
              var roleId = orgRoleId.substr(0, orgRoleId.indexOf('_'));
              var options = multiselectObj.find('option[value=' + roleId + ']');
              if(!options.length) {
                multiselectObj.append($('<option>').val(roleId).text(checkedNode.text));
              }
            }
          } else {
            if($checked.val() == 'usr' && checkedNodes[0].id == 0) {
              MyCuckoo.alertMsg({title : '提示', msg : '请选择用户!'});
              return;
            }
            for (var i = 0; i < checkedNodes.length; i++) {
              var checkedNode = checkedNodes[i];
              var orgRoleId = checkedNode.id;
              var options = multiselectObj.find('option[value=' + orgRoleId + ']');
              if(!options.length) {
                multiselectObj.append($('<option>').val(orgRoleId).text(checkedNode.text));
              }
            }
          }
        };
        
        /!**
         * 选择移除机构、角色或用户
         * 
         * @param 多选机构、角色或用户框
         * @param 机构、机构角色或用户树
         *!/
        var unselected = function(multiselectObj, treeObj) {
          var $checked = $(this).find(':radio[name=rowPri]:checked');
          var $selected = multiselectObj.find(':selected');
          if (!$selected.length) {
            MyCuckoo.alertMsg({ title : '提示', msg : '请您选择右边列表!' });
            return;
          }
          $.each($selected, function(index, item) {
            var node = null;
            if($checked.val == 'rol') {
              node = treeObj.getNodeByParam('id', item.value + '_2');
            } else {
              node = treeObj.getNodeByParam('id', item.value);
            }
            if(node) {
              treeObj.checkNode(node, false);
            }
          });
          multiselectObj.html(multiselectObj.find(':not(:selected)'));
        };
        
        /!**
         * 行权限改变事件
         * 
         * @param multiselectObj 复选框对象
         * @param treeObj 树对象
         * @param privilegeType 权限类型
         * @param initBol 是否进行初始化 
         *!/
        var radioChangeEvent = function(multiselectObj, treeObj, userId, privilegeType, initBol) {
          $.post('${ctx}/uum/userMgr/getSelectRowPrivilege', {id : userId}, function(data) {
            var privilegeTypeSelected = data.rowPrivilege;
            var rowList = data.rowList;
            var dataUrl = '';
            //初始化
            if(!privilegeType && initBol) {
              if(privilegeTypeSelected) {
                if(privilegeTypeSelected == 'org') {
                  dataUrl = '${ctx}/uum/organMgr/getChildNodes';
                  treeObj.parent().prev('span').text('未选机构');
                  multiselectObj.prev('span').text('已选机构');
                } else if(privilegeTypeSelected == 'rol') {
                  dataUrl = '${ctx}/uum/userMgr/getChildNodes?isCheckbox=Y';
                  treeObj.parent().prev('span').text('未选角色');
                  multiselectObj.prev('span').text('已选角色');
                } else if(privilegeTypeSelected == 'usr') {
                  treeObj.parent().prev('span').text('未选用户');
                  multiselectObj.prev('span').text('已选用户');
                }
                for (var i = 0; i < rowList.length; i++) {
                  multiselectObj.append($('<option>').val(rowList[i].orgId).text(rowList[i].orgSimpleName));
                }
              }
            } else {
              if(privilegeType == 'org') {
                dataUrl = '${ctx}/uum/organMgr/getChildNodes';
                treeObj.parent().prev('span').text('未选机构');
                multiselectObj.prev('span').text('已选机构');
              } else if(privilegeType == 'rol') {
                dataUrl = '${ctx}/uum/userMgr/getChildNodes?isCheckbox=Y';
                treeObj.parent().prev('span').text('未选角色');
                multiselectObj.prev('span').text('已选角色');
              } else if(privilegeType == 'usr') {
                treeObj.parent().prev('span').text('未选用户');
                multiselectObj.prev('span').text('已选用户');
              }
              multiselectObj.empty();
              //显示对应列表
              if(privilegeType == privilegeTypeSelected) {
                for (var i = 0; i < rowList.length; i++) {
                  multiselectObj.append($('<option>').val(rowList[i].orgId).text(rowList[i].orgSimpleName));
                }
              }
            }
            var $searchUsr = treeObj.parents('div.tab-pane').find('label.searchUsr').hide();
            if(privilegeType != 'usr') {//非用户重新加载左边列表
              var setting = {
                  async : { enable : true, type : 'get', url : dataUrl, autoParam : [ 'id=treeId' ] },
                  check : { enable : true },
                  data : { key : { name : 'text', icon : 'iconCls' } },
                  view : {
                    dblClickExpand : false, showLine : true, selectedMulti : false,
                    expandSpeed : ($.browser.msie && parseInt($.browser.version) <= 6) ? '' : 'fast'
                  }
              };
              $.fn.zTree.init(treeObj, setting);
            } else {
              var setting = {
                  check : { enable : true },
                  callback : {
                    onCheck : function(event, treeId, treeNode) {
                      if(treeNode.checked) {
                         var rightTreeObj = $.fn.zTree.getZTreeObj(treeObj.attr('id'));
                         rightTreeObj.expandNode(treeNode, true, true, true);
                      }
                    }
                  }
              };
              $.fn.zTree.init(treeObj, setting);
              $searchUsr.off().children().off().end().show();
              $searchUsr.on('keyup', 'input', function(event) {
                if(event.keyCode != 13) return;
                $.post('queryUsersByUserName', {userName : this.value}, function(data) {
                  var nodes = [];
                  $.each(data, function() {
                    nodes.push({id : this.userId, text : this.userName, name : this.userName, isParent : false});
                  });
                  $.fn.zTree.getZTreeObj(treeObj.attr('id')).addNodes(null, nodes);
                });
              });
              $searchUsr.on('click', '.btn', function() {
                $.post('queryUsersByUserName', {userName : $searchUsr.children()[0].value}, function(data) {
                  var nodes = [];
                  $.each(data, function() {
                    nodes.push({id : this.userId, text : this.userName, name : this.userName, isParent : false});
                  });
                  $.fn.zTree.getZTreeObj(treeObj.attr('id')).addNodes(null, nodes);
                });
              });
            }
          });
        };
        
        var $modal = $(MyCuckoo.modalTemplate);
        $modal.on('hidden.bs.modal', function() { $(this).off().find('.btn').off().end().remove(); });
        $modal.find('h3').text('用户分配特殊权限');
        $modal.find('.modal-body:first').load('queryUserPrivilegeList', {id :  _jsonObj.userId, userName : _jsonObj.userName}, function() {
          var setting1 = {
              check : { enable : true },
              data : {
                key : { name : 'text' },
                simpleData : { enable : true, pIdKey : 'parentId', rootPId : null }
              },
              callback : {
                onCheck : function(event, treeId, treeNode) {
                  if(treeNode.checked) {
                     var leftTreeObj = $.fn.zTree.getZTreeObj('left_user_tree');
                     leftTreeObj.expandNode(treeNode, true, true, true);
                  }
                }
              }
          };
          var setting2 = {
              check : { enable : true },
              data : {
                key : { name : 'text' },
                simpleData : { enable : true, pIdKey : 'parentId', rootPId : null }
              },
              callback : {
                onCheck : function(event, treeId, treeNode) {
                  if(treeNode.checked) {
                     var rightTreeObj = $.fn.zTree.getZTreeObj('right_user_tree');
                     rightTreeObj.expandNode(treeNode, true, true, true);
                  }
                }
              }
          };
          var leftTreeData = $.parseJSON($modal.find('#left_user_tree').attr('data'));
          var rightTreeData = $.parseJSON($modal.find('#right_user_tree').attr('data'));
          $modal.find('#left_user_tree').removeAttr('data');
          $modal.find('#right_user_tree').removeAttr('data');
          var leftTreeObj = $.fn.zTree.init($modal.find('#left_user_tree'), setting1, leftTreeData);
          var rightTreeObj = $.fn.zTree.init($modal.find('#right_user_tree'), setting2, rightTreeData);
          // 添加勾上的模块
          $modal.off('click', '.to-right:eq(0)').on('click', '.to-right:eq(0)', function() {
            selUnselOpt(leftTreeObj, rightTreeObj);
          });
          // 移除勾上的模块
          $modal.off('click', '.to-left:eq(0)').on('click', '.to-left:eq(0)', function() {
            selUnselOpt(rightTreeObj, leftTreeObj);
          });
          // 行权限选择事件
          var $leftRowTree = $modal.find('#left_row_tree');
          var $rightRowMultiSelect = $modal.find('#right_row_multi_select');
          radioChangeEvent($rightRowMultiSelect, $leftRowTree, _jsonObj.userId, '', true);
          $modal.off('change', ':radio[name=rowPri]').on('change', ':radio[name=rowPri]', function() {
            radioChangeEvent($rightRowMultiSelect, $leftRowTree, _jsonObj.userId, this.value);
          });
          // 添加勾上的选择
          $modal.off('click', '.to-right:eq(1)').on('click', '.to-right:eq(1)', function() {
            selected($rightRowMultiSelect, $.fn.zTree.getZTreeObj($leftRowTree.attr('id')));
          });
          // 移除勾上的选择
          $modal.off('click', '.to-left:eq(1)').on('click', '.to-left:eq(1)', function() {
            unselected($rightRowMultiSelect, $.fn.zTree.getZTreeObj($leftRowTree.attr('id')));
          });
          // 保存权限相关
          $form = $modal.find('div.tab-pane form.form-inline');
          $modal.on('click', '.panel-footer:eq(0) .btn', function() {
            if($form.eq(0).find('input:checked').length == 0) {
              MyCuckoo.alertMsg({ title : '提示', msg : '请选择权限范围!' });
              return;
            }
            var optPrivilegeScope = $form.eq(0).find('input:checked').val();
            var selectedNodes = rightTreeObj.getNodesByFilter(function(node) {
              if(!node.isParent) return true;
              return false;
            });
            var optIdList = [];
            $.each(selectedNodes, function(index, node) {
              optIdList.push(Number(node.id) - 1000);
            });
            $.post('saveOptPrivilege', {id : _jsonObj.userId, privilegeScope : optPrivilegeScope, optIdList : optIdList.join(',')}, function(data) {
              if(data.status) {
                MyCuckoo.showMsg({state:'success', title: '提示', msg: data.msg});
              } else {
                MyCuckoo.showMsg({state:'danger', title: '提示', msg: data.msg});
              }
            });
          });
          $modal.on('click', '.panel-footer:eq(1) .btn', function() {
            if($form.eq(1).find('input:checked').length == 0) {
              MyCuckoo.alertMsg({ title : '提示', msg : '请选择行权限类别!' });
              return;
            }
            var rowPrivilege = $form.eq(1).find('input:checked').val();
            var $selected = $modal.find('#right_row_multi_select > option');
            var roleIdList = [];
            $.each($selected, function(index, item) {
              roleIdList.push(item.value);
            });
            $.post('saveRowPrivilege', {id : _jsonObj.userId, rowPrivilege : rowPrivilege, roleIdList : roleIdList.join(',')}, 
                function(data) {
              if(data.status) {
                MyCuckoo.showMsg({state: 'success', title: '提示', msg: data.msg});
              } else {
                MyCuckoo.showMsg({state: 'danger', title: '提示', msg: data.msg});
              }
            });
          });
        });
        $modal.find('.modal-footer .btn:first').remove();
        $modal.modal();
        $modal.appendTo($('body'));
      }
      
      // 分配角色
      function assignRole() {
        var $singleCheck = $main.find('.table input:checked[name=single]');
        if ($singleCheck.size() != 1) {
          MyCuckoo.showMsg({ state : 'warning', title : '提示', msg : '请选择一条件记录!' });
          return;
        }
        var _jsonObj = $.parseJSON($singleCheck.next(':first').html());
        if (BasicConstant.OPT_DISABLE_LINK == _jsonObj.status) {
          MyCuckoo.showMsg({ state : 'warning', title : '提示', msg : '请先启用此用户！' });
          return;
        }
        var $modal = $(MyCuckoo.modalTemplate);
        $modal.on('hidden.bs.modal', function() { $(this).off().find('.btn').off().end().remove(); });
        $modal.find('h3').text('用户分配角色');
        $modal.find('.modal-body:first').load('queryUserRolePrivilegeList', {
              id : _jsonObj.userId, 
              userName : _jsonObj.userName,
              defaultRoleId : _jsonObj.uumOrgRoleId,
              defaultRoleName : _jsonObj.uumOrgName + '-' + _jsonObj.uumRoleName
            }, function() {
              
              var setting1 = {
                  async : { enable : true, type : 'get', url : 'getChildNodes?isCheckbox=Y', autoParam : [ 'id=treeId' ] },
                  check : { enable : true },
                  data : {
                    key : { name : 'text' },
                    simpleData : { enable : true, pIdKey : 'parentId', rootPId : null }
                  },
                  callback : {
                    onCheck : function(event, treeId, treeNode) {
                      if(treeNode.checked) {
                         var _leftTreeObj = $.fn.zTree.getZTreeObj('left_role_tree');
                         _leftTreeObj.expandNode(treeNode, true, true, true);
                      }
                    }
                  }
              };
              // tab事件
              $modal.on('click', 'ul.nav-tabs a', function (e) {
                e.preventDefault();
                $(this).tab('show');
              });
              var leftTreeData = $.parseJSON($modal.find('#left_role_tree').attr('data'));
              $modal.find('#left_role_tree').removeAttr('data');
//              leftTreeData = _iNodes.replace(/(\w+)\s*:\s*'([^']*)'/g, '"$1" : "$2"');
              var leftTreeObj = $.fn.zTree.init($modal.find('#left_role_tree'), setting1, leftTreeData);
              // 添加勾上的角色
              $modal.off('.to-right').on('click', '.to-right', function() {
                selected($modal.find('#right_role_multi_select'), leftTreeObj);
              });
              // 移除勾上的角色
              $modal.off('.to-left').on('click', '.to-left', function() {
                unselected($modal.find('#right_role_multi_select'), leftTreeObj);
              });
              // 保存权限相关
              $modal.on('click', '.panel-footer .btn:eq(0)', function() {
                var $selected = $modal.find('#right_role_multi_select > :selected:first');
                if(!$selected.length) {
                  MyCuckoo.alertMsg({ title : '提示', msg : '请您在右边列表选择一个角色!' });
                  return;
                }
                $modal.find('input[name=defaultRoleId]').val($selected.val());
                $modal.find('p.defaultRoleName').text($selected.text());
              });
              $modal.on('click', '.panel-footer .btn:eq(1)', function() {
                var $selected = $modal.find('#right_role_multi_select > option');
                var $defaultRoleId = $modal.find('input[name=defaultRoleId]');
                if(!$defaultRoleId.val()) {
                  MyCuckoo.alertMsg({ title : '提示', msg : '请为用户选择一个默认角色!' });
                } else if(!$selected.length) {
                  MyCuckoo.alertMsg({ title : '提示', msg : '请为用户分配一个角色!' });
                } else {
                  var roleIdList = [];
                  $.each($selected, function(index, item) {
                    roleIdList.push(item.value);
                  });
                  $.post('saveRolePrivilege', 
                      {id : _jsonObj.userId, defaultRoleId : $defaultRoleId.val(), roleIdList : roleIdList.join(',')}, 
                        function(data) {
                        
                    if(data.status) {
                      MyCuckoo.showMsg({state:'success', title: '提示', msg: data.message});
                    } else {
                      MyCuckoo.showMsg({state:'danger', title: '提示', msg: data.message});
                    }
                  });
                }
              });
        });
        $modal.find('.modal-footer .btn:first').remove();
        $modal.modal();
        $modal.appendTo($('body'));
        
        /!**
         * 选择添加角色
         * 
         * @param 多选角色框
         * @param 机构角色树
         *!/
        var selected = function(multiselectObj, treeObj) {
          var checkedNodes = treeObj.getCheckedNodes(true);
          if(checkedNodes.length == 0) {
            MyCuckoo.alertMsg({ title : '提示', msg : '请您选择相应角色!' });
            return;
          }
          for (var i = 0; i < checkedNodes.length; i++) {
            var checkedNode = checkedNodes[i];
            var parentNode = checkedNode.getParentNode();
            var orgRoleId = checkedNode.id;
            var roleId = orgRoleId.substr(0, orgRoleId.indexOf('_'));
            var options = multiselectObj.find('option[value=' + roleId + ']');
            if(!options.length) {
              var $option = $('<option>');
              $option.val(roleId);
              parentNode ? $option.text(parentNode.text + '-' + checkedNode.text) : $option.text(checkedNode.text);
              multiselectObj.append($option);
            }
          }
          if(multiselectObj.find('option').length == 1) {
            var option = multiselectObj.find('option')[0];
            $modal.find('input[name=defaultRoleId]').val(option.value);
            $modal.find('input[name=defaultRoleName]').val(option.text);
          }
        };
        
        /!**
         * 选择移除角色
         * 
         * @param 多选角色框
         * @param 机构角色树
         *!/
        var unselected = function(multiselectObj, treeObj) {
          var $selected = multiselectObj.find(':selected');
          if (!$selected.length) {
            MyCuckoo.alertMsg({ title : '提示', msg : '请您选择角色列表!' });
            return;
          }
          var defaultRoleId = $modal.find('input[name=defaultRoleId]').val();
          $.each($selected, function(index, item) {
            var node = treeObj.getNodeByParam('id', item.value + '_2');
            if(node) {
              treeObj.checkNode(node, true);
              if(defaultRoleId == item.value) {
                $modal.find('input[name=defaultRoleId]').val('');
                $modal.find('input[name=defaultRoleName]').val('');
              }
            }
          });
          multiselectObj.html(multiselectObj.find(':not(:selected)'));
          
          if(multiselectObj.find('option').length == 1) {
            var option = multiselectObj.find('option')[0];
            $modal.find('input[name=defaultRoleId]').val(option.value);
            $modal.find('input[name=defaultRoleName]').val(option.text);
          } else if(multiselectObj.find('option').length == 0) {
            $modal.find('input[name=defaultRoleId]').val('');
            $modal.find('input[name=defaultRoleName]').val('');
          }
        };
      }
      // the end...
      
    });*/
</script>