<template>
  <div class="text-center">
    <ul class="pagination pagination-sm">
      <template v-if="page.hasPreviousPage">
      <li><a href="#?pageNo=1&searchParams}">«</a></li>
      <li><a href="#?pageNo=${current - 1}&${searchParams}">‹</a></li>
      </template>
      <template v-else>
      <li class="disabled"><a href="#">«</a></li>
      <li class="disabled"><a href="#">‹</a></li>
      </template>

      <template v-for="i in end">
        <li v-if="i >= begin && i == current" class="active"><a :href="'#?pageNo=' + i">{{ i }}</a></li>
        <li v-if="i >= begin && i != current"><a :href="'#?pageNo=' + i">{{ i }}</a></li>
      </template>

      <template v-if="page.hasNextPage">
      <li><a :href="'#?pageNo=' + current + 1 + '&${searchParams}'">›</a></li>
      <li><a :href="'#?pageNo=' + page.totalPages + '&${searchParams}'">»</a></li>
      </template>
      <template v-else>
      <li class="disabled"><a href="#">›</a></li>
      <li class="disabled"><a href="#">»</a></li>
      </template>
    </ul>
  </div>
</template>
<script>
  export default {
    props: {
      page: Object,
      paginationSize: Number
    },
    data () {
      let current = this.page.number + 1;
      let begin = Math.max(1, current - this.paginationSize / 2);
      let end = Math.min(begin + (this.paginationSize - 1), this.page.totalPages);
      return {
        current: current,
        begin: begin,
        end: end
      }
    },
    created() {

    },
    methods: {

    }
  }
</script>

