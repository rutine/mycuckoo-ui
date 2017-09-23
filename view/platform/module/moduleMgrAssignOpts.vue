<template>
  <div>
    <h4>{{ moduleName }}<input type="hidden" :value="moduleId" /></h4>
    <div class="select-side">
      <span class="muted">未选操作</span>
      <select id="left_multi_select" class="select-side-body"
              multiple="multiple" v-model="selectData">
        <option v-for="operate in leftObj" :value="operate">{{ operate.operateName }}</option>
      </select>
    </div>
    <div class="select-opt">
      <p class="to-right" title="添加" @click="selected(leftObj, rightObj)">&lt;&lt;</p>
      <p class="to-left" title="移除" @click="selected(rightObj, leftObj)">&gt;&gt;</p>
    </div>
    <div class="select-side">
      <span class="muted">已选操作</span>
      <select id="right_multi_select" class="select-side-body"
              multiple="multiple" v-model="selectData">
        <option v-for="operate in rightObj" :value="operate">{{ operate.operateName }}</option>
      </select>
    </div>
    <div class="clearfix"></div>
    <div class="panel-footer">
      <button type="button" class="btn btn-default btn-sm" @click="config.view = ''">返回</button>
      <button type="button" class="btn btn-primary btn-sm" @click="save">保存</button>
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
      moduleId: this.config.module.moduleId,
      moduleName: this.config.module.modName,

      leftObj: null,
      rightObj: null,
      selectData: [],
    }
  },
  mounted() {
    let $vue = this;
    $vue.api.moduleMgr.listOperation({moduleId: $vue.moduleId, modName: ''}).then(data => {
      $vue.leftObj = data.unassign;
      $vue.rightObj = data.assign;
    });
  },
  methods: {
    /**
     * 选择操作
     *
     * @param 多选角色框
     * @param 机构角色树
     */
    selected(fromObj, toObj) {
      if (!this.selectData.length) {
        MyCuckoo.alertMsg({ title : '提示', msg : '请您分配相应的操作!' });
        return;
      }


      for(let index in this.selectData) {
        let item = this.selectData[index];

        toObj.push(item);

        fromObj.forEach((item2, index) => {
          if(item2.operateId == item.operateId) {
            fromObj.splice(index, 1);
          }
        });
      }

      this.selectData = [];
    },
    //保存角色
    save() {
      if(!this.rightObj.length) {
        MyCuckoo.alertMsg({ title : '提示', msg : '请为用户分配一个角色!' });
      } else {
        let operateIds = [];
        this.rightObj.forEach(item => operateIds.push(item.operateId));

        let params = {
          moduleId: this.moduleId,
          operateIds: operateIds.join(',')
        }

        this.api.moduleMgr.createModuleOptRefs(params).then(data => {
          MyCuckoo.showMsg({state:'success', title: '提示', msg: data});

          this.$emit('refresh');
          this.config.view = '';
        });
      }
    }
    //end
  }
}
</script>