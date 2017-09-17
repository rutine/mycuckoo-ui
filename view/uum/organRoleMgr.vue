<template>
<div class="row">
  <div v-show="!config.view">
  <div class="col-sm-3 col-md-2 mycuckoo-sidebar">
    <ul class="nav">
      <li style="font-size:13px">
        <strong>机构树(请首先选择机构)</strong>
      </li>
      <li><ul id="tree_organ_role" class="ztree"></ul></li>
    </ul>
  </div>
  <div class="col-sm-9 col-md-10 mycuckoo-submain">

    <!-- 查询表单 -->
    <div class="page-header">
      <form class="form-inline" name="searchForm">
        <div class="form-group">
          <label class="sr-only">角色名称</label>
          <input type="text" class="form-control input-sm" v-model="param.roleName" placeholder=角色名称 />
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
        <th>角色名称</th>
        <th>角色状态</th>
        <th class="hidden">备注</th>
        <th>创建人</th>
        <th>创建日期</th>
      </tr>
      <tr v-for="(item, index) in page.content">
        <td><input type="checkbox" name="single" v-model="selectData" :value="item" /></td>
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
  </div>

  <component :is="config.view" :config="config" @refresh="list"></component>
</div>
</template>
<script>
import unselectRoleForm from './organRoleMgrListUnselectRole.vue';

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
        roleName: null,
        pageNo: 1,
        pageSize: 10
      },
      selectData: [],
      config: {},
      zTree: null
    }
  },
  mounted() {
    let $vue = this;
    let setting = {
      check : { enable : false},
      data : { key : { name : 'text', icon : 'iconCls' } },
      view : {
        showLine : true,
        showIcon : false
      },
      callback : {
        onClick : function(event, treeId, treeNode) {
          $vue.param.treeId = treeNode.id;
          $vue.list();
        },
        beforeExpand : function(treeId, treeNode) {
          !treeNode.loaded && $vue.api.organMgr.getChildNodes({ treeId: treeNode.id }).then(data => {
            treeNode.loaded = true;
            $vue.zTree.addNodes(treeNode, data, true);
          });
        }
      }
    };

    $vue.api.organMgr.getChildNodes(null).then(data => {
      $vue.zTree = $.fn.zTree.init($('#tree_organ_role'), setting, data);
    });

    $vue.list();
  },
  components: {
    unselectRoleForm: unselectRoleForm
  },
  methods: {
    //列表
    list() {
      let $vue = this;
      $vue.selectData = [];
      $vue.api.organRoleMgr.list($vue.param).then(data => {
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
    //操作
    operator(fn) {
      eval('this.' + fn + '()');
    },

    //分配角色
    roleassign() {
      let nodes = this.zTree.getSelectedNodes();
      if(nodes.length != 1) {
        MyCuckoo.showMsg({ state : 'warning', title : '提示', msg : '请选择要分配角色的机构' });
        return;
      }

      this.config = {
        view: 'unselectRoleForm',
        action: 'update',
        organ: nodes[0]
      }
    },
    //删除角色
    roledel() {
      this.checkSelect();

      let $vue = this;
      MyCuckoo.showDialog({
        title: '警告提示',
        msg: '您确认删除此记录吗?',
        okBtn: '是',
        cancelBtn: '否',
        ok: function() {
          let orgId = $vue.zTree.getSelectedNodes()[0].id;
          let params = {id :  orgId, roleIdList : $vue.selectData[0].roleId};
          $vue.api.organRoleMgr.del(params).then(data => {
            MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

            $vue.list(); // 刷新列表
          });
        }
      });
    }

  }
}
</script>
<!--<script type="text/javascript">
		jQuery(function($) {
			var config = {};
			var $main = $('.mycuckoo-submain');
			var setting = {
				async : { enable : true, type : 'get', url : '${ctx}/uum/organMgr/getChildNodes', autoParam : [ 'id=treeId' ] },
				callback : {
					onClick : function(evane, treeId, treeNode) {
						var queryString = $main.find('form[name=searchForm]').serialize();
						var params = MyCuckoo.fromQueryString(queryString);
						MyCuckoo.apply(params, config);
						params.treeId = treeNode.id;
						reload(params);
					}
				},
				data : { key : { name : 'text', icon : 'iconCls' } },
				view : {
					dblClickExpand : false, showLine : true, selectedMulti : false,
					expandSpeed : ($.browser.msie && parseInt($.browser.version) <= 6) ? '' : 'fast'
				}
			};
			var zTree = $.fn.zTree.init($('#tree_role_organ'), setting);

			
			// 为机构分配角色
			function assignRole() {
				var orgNodes = zTree.getSelectedNodes();
				if(orgNodes.length != 1) {
					MyCuckoo.showMsg({ state : 'warning', title : '提示', msg : '请选择要分配角色的机构' });
					return;
				}
				var $modal = $(MyCuckoo.modalTemplate);
				$modal.on('hidden.bs.modal', function() { $(this).off().find('.btn').off().end().remove(); });
				$modal.find('h3').text('选择角色');
				$modal.find('.modal-body').load('queryUnselectedRoleList', 
						{treeId : orgNodes[0].id}, function() {
							
					modalCallBack();
				});
				// 保存为机构分配的角色
				$modal.on('click', '.modal-footer .btn:first', function() {
					var $singleCheck = $modal.find('.table input:checked[name=single]');
					if($singleCheck.size() == 0) {
						MyCuckoo.showMsg({state: 'danger', title: '提示', msg: '请选择一条或多条记录!'});
						return;
					}
					var roleIdList = [];
					$singleCheck.each(function() {
						var _json = $.parseJSON($(this).next(':first').html());
						roleIdList.push(_json.roleId);
					});
					$.post('save', {id : orgNodes[0].id, roleIdList : roleIdList.join(',')}, function(data) {
						if(data.status) {
							MyCuckoo.showMsg({state:'success', title: '提示', msg: data.msg});
						} else {
							MyCuckoo.showMsg({state:'danger', title: '提示', msg: data.msg});
						}
						// 刷新列表
						reload(MyCuckoo.apply({treeId : orgNodes[0].id}, config));
						$modal.modal('hide');
					});
				});
				$modal.modal();
				$modal.appendTo($('body'));
				
				function modalCallBack() {
					// page分页
					$modal.off('click', '.pagination li > a');
					$modal.on('click', '.pagination li > a', function(event) {
						event.preventDefault(); // 阻止超链接点击事件
						var cls = $(this).parent('li').attr('class');
						if(cls == 'disabled' || cls == 'active') return;
						
						var params = MyCuckoo.fromQueryString($(this).attr('href'));
						MyCuckoo.apply(params, config);
						// 刷新列表
						$modal.find('.modal-body').load('unselectedRoleList', params, function() {
							modalCallBack();
						});
					});
					// 复选框
					MyCuckoo.checkbox($modal);
				}
			}
			
			// 删除操作
			function del() {
				var $singleCheck = $main.find('.table input:checked[name=single]');
				if($singleCheck.size() == 0) {
					MyCuckoo.showMsg({state: 'warning', title: '提示', msg: '请至少选择一条记录!'});
					return;
				}
				MyCuckoo.showDialog({
					title: '警告提示',
					msg: '您确认删除此记录吗?',
					okBtn: '是',
					cancelBtn: '否',
					ok: function() {
						var roleIdList = [];
						$singleCheck.each(function() {
							var _json = $.parseJSON($(this).next(':first').html());
							roleIdList.push(_json.roleId);
						});
						var orgId = zTree.getSelectedNodes()[0].id;
						$.getJSON('delete', {id :  orgId, roleIdList : roleIdList.join(',')}, function(json) {
							if(json.code == 1) {
								MyCuckoo.showMsg({state:'danger', title: '提示', msg: '您不能删除选择角色,角色下已有用户,请先将相应用户的角色删除!'});
							} else if(json.status) {
								MyCuckoo.showMsg({state:'success', title: '提示', msg: json.msg});
								// 刷新页面
								reload(MyCuckoo.apply({treeId : orgId}, config));
							} else {
								MyCuckoo.showMsg({state:'error', title: '提示', msg: json.msg});
							}
						});
					}
				});
			}
		});
	</script>-->