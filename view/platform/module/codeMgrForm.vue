<template>
  <div class="row">
    <div class="col-sm-12 col-md-12">
      <h3 class="page-header">系统编码管理</h3>
      <!-- 表单操作按钮 -->
      <toolbar name="formOpt" :value="config.action" v-on:operator="operator"></toolbar>

      <form name="editForm" action="editForm" method="post">
        <input type="hidden" name="codeId" v-model="formData.codeId"/>
        <div class="jumbotron" style="margin-bottom:10px; padding:15px; font-size:12px;">
          <p><strong  class="text-info">系统编码参数</strong></p>
          <table class="table">
            <tr>
              <td width=14%><label>英文编码</label></td>
              <td><input type=text  name="codeEngName" v-model="formData.codeEngName" class="required alphanumeric" maxlength="20"/></td>
              <td width=14%><label>中文编码</label></td>
              <td><input type=text name="codeName" v-model="formData.codeName" class="required" maxlength="20"/></td>
            </tr>
            <tr>
              <td width=14%><label>模块名称</label></td>
              <td>
                <input type=text name="moduleName" v-model="formData.moduleName" class="required" />
                <span class="btn btn-warning badge"><span class="glyphicon glyphicon-search"></span></span>
              </td>
              <td width=14%><label>编码状态</label></td>
              <td>
                <select name="status" class="required" v-model="formData.status">
                  <option value="enable">启用</option>
                  <option value="disable">停用</option>
                </select>
              </td>
            </tr>
            <tr>
              <td width=14%><label>分隔符</label></td>
              <td>
                <select name="delimite" v-model="formData.delimite" class="required" @change="calcCodeEffect">
                  <option value="-">-</option>
                  <option value="_">_</option>
                  <option value=":">:</option>
                  <option value="/">/</option>
                  <option value="|">|</option>
                </select>
              </td>
              <td width=14%><label>编码备注</label></td>
              <td><input type="text" name="memo" v-model="formData.memo" maxlength="50"/></td>
            </tr>
            <tr>
              <td width=14%><label>段数</label></td>
              <td>
                <select name="partNum" class="required" v-model="formData.partNum">
                  <option value="1">1</option>
                  <option value="2">2</option>
                  <option value="3">3</option>
                  <option value="4">4</option>
                </select>
              </td>
              <td width=14%><label>编码效果</label></td>
              <td><input type="text" name="codeEffect" v-model="formData.codeEffect" readOnly/></td>
            </tr>
          </table>
        </div>
        <div class="jumbotron" style="margin-bottom:10px; padding:15px; font-size:12px;">
          <p><strong  class="text-info">编码格式设置</strong></p>
          <table class="table">
            <tr>
              <td width=14%><label>段一格式</label></td>
              <td>
                <select name="part1" v-model="formData.part1" >
                  <option value="char">字符</option>
                  <option value="date">日期</option>
                  <option value="number">序号</option>
                  <option value="sysPara">系统参数</option>
                </select>
              </td>
              <td width=14%><label>段一格式内容</label></td>
              <td>
                <div v-if="formData.part1 == 'date'">
                  <select name="part1Con" v-model="formData.part1Con" @change="calcCodeEffect">
                    <option value="yyyy">年(yyyy)</option>
                    <option value="yyyyMM">年月(yyyyMM)</option>
                    <option value="yyyyMMdd">年月日(yyyyMMdd)</option>
                  </select>
                </div>
                <div v-else-if="formData.part1 == 'number'">
                  <select name="part1Con" v-model="formData.part1Con" @change="calcCodeEffect">
                    <option value="01">两位(01)</option>
                    <option value="001">三位(001)</option>
                    <option value="0001">四位(0001)</option>
                    <option value="00001">五位(00001)</option>
                    <option value="000001">六位(000001)</option>
                  </select>
                </div>
                <div v-else-if="formData.part1 == 'sysPara'">
                  <select name="part1Con" v-model="formData.part1Con" @change="calcCodeEffect">
                    <option value="userName">用户名</option>
                    <option value="roleUser">角色+用户名</option>
                    <option value="organRoleUser">机构+角色+用户名</option>
                  </select>
                </div>
                <div v-else="">
                  <input type="text" name="part1Con" v-model="formData.part1Con" @change="calcCodeEffect"/>
                </div>
              </td>
            </tr>
            <tr>
              <td width=14%><label>段二格式</label></td>
              <td>
                <select name="part2" v-model="formData.part2" :disabled="part2Disable">
                  <option value="char">字符</option>
                  <option value="date">日期</option>
                  <option value="number">序号</option>
                  <option value="sysPara">系统参数</option>
                </select>
              </td>
              <td width=14%><label>段二格式内容</label></td>
              <td>
                <div v-if="formData.part2 == 'date'">
                  <select name="part1Con" v-model="formData.part2Con" :disabled="part2Disable" @change="calcCodeEffect">
                    <option value="yyyy">年(yyyy)</option>
                    <option value="yyyyMM">年月(yyyyMM)</option>
                    <option value="yyyyMMdd">年月日(yyyyMMdd)</option>
                  </select>
                </div>
                <div v-else-if="formData.part2 == 'number'">
                  <select name="part2Con" v-model="formData.part2Con" :disabled="part2Disable" @change="calcCodeEffect">
                    <option value="01">两位(01)</option>
                    <option value="001">三位(001)</option>
                    <option value="0001">四位(0001)</option>
                    <option value="00001">五位(00001)</option>
                    <option value="000001">六位(000001)</option>
                  </select>
                </div>
                <div v-else-if="formData.part2 == 'sysPara'">
                  <select name="part2Con" v-model="formData.part2Con" :disabled="part2Disable" @change="calcCodeEffect">
                    <option value="userName">用户名</option>
                    <option value="roleUser">角色+用户名</option>
                    <option value="organRoleUser">机构+角色+用户名</option>
                  </select>
                </div>
                <div v-else="">
                  <input type="text" name="part2Con" v-model="formData.part2Con" :disabled="part2Disable" @change="calcCodeEffect"/>
                </div>
              </td>
            </tr>
            <tr>
              <td width=14%><label>段三格式</label></td>
              <td>
                <select name="part3" v-model="formData.part3" :disabled="part3Disable">
                  <option value="char">字符</option>
                  <option value="date">日期</option>
                  <option value="number">序号</option>
                  <option value="sysPara">系统参数</option>
                </select>
              </td>
              <td width=14%><label>段三格式内容</label></td>
              <td>
                <div v-if="formData.part3 == 'date'">
                  <select name="part3Con" v-model="formData.part3Con" :disabled="part3Disable" @change="calcCodeEffect">
                    <option value="yyyy">年(yyyy)</option>
                    <option value="yyyyMM">年月(yyyyMM)</option>
                    <option value="yyyyMMdd">年月日(yyyyMMdd)</option>
                  </select>
                </div>
                <div v-else-if="formData.part3 == 'number'">
                  <select name="part3Con" v-model="formData.part3Con" :disabled="part3Disable" @change="calcCodeEffect">
                    <option value="01">两位(01)</option>
                    <option value="001">三位(001)</option>
                    <option value="0001">四位(0001)</option>
                    <option value="00001">五位(00001)</option>
                    <option value="000001">六位(000001)</option>
                  </select>
                </div>
                <div v-else-if="formData.part3 == 'sysPara'">
                  <select name="part3Con" v-model="formData.part3Con" :disabled="part3Disable" @change="calcCodeEffect">
                    <option value="userName">用户名</option>
                    <option value="roleUser">角色+用户名</option>
                    <option value="organRoleUser">机构+角色+用户名</option>
                  </select>
                </div>
                <div v-else="">
                  <input type="text" name="part3Con" v-model="formData.part3Con" :disabled="part3Disable" @change="calcCodeEffect"/>
                </div>
              </td>
            </tr>
            <tr>
              <td width=14%><label>段四格式</label></td>
              <td>
                <select name="part4" v-model="formData.part4" :disabled="part4Disable">
                  <option value="char">字符</option>
                  <option value="date">日期</option>
                  <option value="number">序号</option>
                  <option value="sysPara">系统参数</option>
                </select>
              </td>
              <td width=14%><label>段四格式内容</label></td>
              <td>
                <div v-if="formData.part4 == 'date'">
                  <select name="part4Con" v-model="formData.part4Con" :disabled="part4Disable" @change="calcCodeEffect">
                    <option value="yyyy">年(yyyy)</option>
                    <option value="yyyyMM">年月(yyyyMM)</option>
                    <option value="yyyyMMdd">年月日(yyyyMMdd)</option>
                  </select>
                </div>
                <div v-else-if="formData.part4 == 'number'">
                  <select name="part4Con" v-model="formData.part4Con" :disabled="part4Disable" @change="calcCodeEffect">
                    <option value="01">两位(01)</option>
                    <option value="001">三位(001)</option>
                    <option value="0001">四位(0001)</option>
                    <option value="00001">五位(00001)</option>
                    <option value="000001">六位(000001)</option>
                  </select>
                </div>
                <div v-else-if="formData.part4 == 'sysPara'">
                  <select name="part4Con" v-model="formData.part4Con" :disabled="part4Disable" @change="calcCodeEffect">
                    <option value="userName">用户名</option>
                    <option value="roleUser">角色+用户名</option>
                    <option value="organRoleUser">机构+角色+用户名</option>
                  </select>
                </div>
                <div v-else="">
                  <input type="text" name="part4Con" v-model="formData.part4Con" :disabled="part4Disable" @change="calcCodeEffect"/>
                </div>
              </td>
            </tr>
          </table>
        </div>
      </form>
    </div>

    <!-- Modal -->
    <div id="code_mgr_form_modal" class="modal fade" tabindex="-1" role="dialog" aria-hidden="true">
      <div class="modal-dialog modal-sm">
        <div class="modal-content">
          <div class="modal-header">
            <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
            <h3>选择模块</h3>
          </div>
          <div class="modal-body">
            <ul class="nav nav-list">
              <li style="font-size:13px"><strong>模块树</strong></li>
              <li><ul class="ztree"></ul></li>
            </ul>
          </div>
          <div class="modal-footer">
            <button class="btn" data-dismiss="modal" aria-hidden="true">关闭</button>
          </div>
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
      if (this.config.id > -1) {
        this.api.codeMgr.view(this.config).then(data => {
          this.formData = data;
        });
      }

      return {
        formData: {
          codeId: null,
          codeEngName: null,
          codeName: null,
          moduleName: null,
          delimite: '-',
          partNum: 1,
          part1: 'char',
          part1Con: null,
          part2: 'char',
          part2Con: null,
          part3: 'char',
          part3Con: null,
          part4: 'char',
          part4Con: null,
          codeEffect: null,
          memo: null,
          status: null,
          creator: null,
          createDate: null
        },
        part1Disable: true,
        part2Disable: true,
        part3Disable: true,
        part4Disable: true,
      }
    },
    watch: {
      'formData.partNum': function (newVal, oldVal) {
        this.part2Disable = newVal < 2;
        this.part3Disable = newVal < 3;
        this.part4Disable = newVal < 4;
        this.calcCodeEffect();
      }
    },
    mounted() {
      let $vue = this;

      let $html = $(this.$el);
      let $modal = $('#code_mgr_form_modal');
      // 选择模块名称
      let setting = {
        data : { key : { name : 'text', icon : 'iconCls' } },
        view : { dblClickExpand : false, showLine : true, selectedMulti : false},
        callback : {
          onClick : function(evane, treeId, treeNode) {
            $vue.formData.moduleName = treeNode.text;
            $modal.modal('hide');
          },
          beforeExpand: function (treeId, treeNode) {
            !treeNode.loaded && $vue.api.moduleMgr.getChildNodes({treeId: treeNode.id}).then(data => {
              treeNode.loaded = true;
              zTree.addNodes(treeNode, data, true);
            });
          }
        },
      };
      let zTree = null;

      $html.on('focus click', 'input[name=moduleName], span.badge', function() {
        $vue.api.moduleMgr.getChildNodes(null).then(data => {
          zTree = $.fn.zTree.init($modal.find('.modal-body .ztree'), setting, data);
          $modal.modal();
        });
      });
      //end
    },
    methods: {
      // format code date and system parameters
      formatDate(format) {
        if (!format) return '';
        let d = new Date();
        if (format == 'yyyy') {
          return d.getFullYear();
        } else if (format == 'yyyyMM') {
          let month = d.getMonth() + 1;
          var monthStr = month < 10 ? '0' + month : month + '';
          return d.getFullYear() + '' + monthStr;
        } else if (format == 'yyyyMMdd') {
          let month = d.getMonth() + 1;
          var monthStr = month < 10 ? '0' + month : month + '';
          return d.getFullYear() + '' + monthStr + '' + d.getDate();
        } else if (format == 'userName') {
          return 'zhangsan';
        } else if (format == 'roleUser') {
          return '管理员~zhangsan';
        } else if (format == 'organRoleUser') {
          return '广州~管理员~zhangsan';
        } else {
          return format;
        }
      },
      //编码效果
      calcCodeEffect() {
        let partNum = parseInt(this.formData.partNum);
        let delimite = this.formData.delimite;
        let codePart1 = this.formatDate(this.formData.part1Con);
        let codePart2 = this.formatDate(this.formData.part2Con);
        let codePart3 = this.formatDate(this.formData.part3Con);
        let codePart4 = this.formatDate(this.formData.part4Con);

        let value;
        switch (partNum) {
          case 2:
            value = codePart1 + delimite + codePart2;
            break;
          case 3:
            value = codePart1 + delimite + codePart2 + delimite + codePart3;
            break;
          case 4:
            value = codePart1 + delimite + codePart2 + delimite + codePart3 + delimite + codePart4;
            break;
          default:
            value = codePart1;
        }
        this.formData.codeEffect = value;
      },


      operator(fn) {
        eval('this.' + fn + '()');
      },
      create() {
        let $vue = this;
        this.api.codeMgr.create(this.formData).then(data => {
          MyCuckoo.showMsg({state: 'success', title: '提示', msg: data});

          $vue.$emit('refresh');
          this.reback();
        });
      },
      update() {
        let $vue = this;
        this.api.codeMgr.update(this.formData).then(data => {
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