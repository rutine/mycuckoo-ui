<template>
  <div class="text-center" v-show="page.totalPages != 0">
    <ul class="pagination pagination-sm">
      <template v-if="!page.firstPage">
      <li><a href="javascript:" @click="selectPage(1)">«</a></li>
      <li><a href="javascript:" @click="selectPage(current - 1)">‹</a></li>
      </template>
      <template v-else>
      <li class="disabled"><a href="javascript:">«</a></li>
      <li class="disabled"><a href="javascript:">‹</a></li>
      </template>

      <template v-for="i in end">
        <li v-if="i >= begin && i == current" class="active"><a href="javascript:" @click="selectPage(i)">{{ i }}</a></li>
        <li v-if="i >= begin && i != current"><a href="javascript:" @click="selectPage(i)">{{ i }}</a></li>
      </template>

      <template v-if="!page.lastPage">
      <li><a href="javascript:" @click="selectPage(current + 1)">›</a></li>
      <li><a href="javascript:" @click="selectPage(page.totalPages)">»</a></li>
      </template>
      <template v-else>
      <li class="disabled"><a href="javascript:">›</a></li>
      <li class="disabled"><a href="javascript:">»</a></li>
      </template>
    </ul>
  </div>
</template>
<script>
  export default {
    props: {
      page: Object
    },
    data () {
      return {
        current: 1,
        begin: 1,
        end: 0
      }
    },
    created() {

    },
    watch: {
      page: function(page) {
        this.current = page.number + 1;
        this.begin = Math.max(1, this.current - parseInt(page.size / 2));
        this.end = Math.min(this.begin + (page.size - 1), page.totalPages);
      }
    },
    methods: {
      selectPage: function(number) {
        this.$emit('selectPage', number);
      }
    }
  }
</script>

