<template>
  <nav v-if="pagination && totalPages > 0" :aria-label="t('pagination.ariaLabel')">
    <ul :class="getPaginationClasses()">

      <li v-if="props.showPageFirstLast" class="page-item"><button class="page-link" href="#" @click="emitPage(1)"><i
            v-if="showPageIcons" class="bi-chevron-double-left"></i><span v-else>{{ pageStringFirst }}</span></button></li>

      <li class="page-item"><button class="page-link" href="#" @click="emitPage(getPrevPage(currentPage))"><i
            v-if="showPageIcons" class="bi-chevron-left"></i><span v-else>{{ pageStringPrev }}</span></button>
      </li>

      <li v-for="(n) in paginationRange()" :class="getPageClasses(n)"><button class="page-link" @click="emitPage(n)">{{ n }}</button></li>
      <li class="page-item"><button class="page-link" href="#" @click="emitPage(getNextPage(currentPage))"><i
            v-if="showPageIcons" class="bi-chevron-right"></i><span v-else>{{ pageStringNext
            }}</span></button>
      </li>
      <li v-if="props.showPageFirstLast" class="page-item"><button class="page-link" href="#"
          @click="emitPage(totalPages)"><i v-if="showPageIcons" class="bi-chevron-double-right"></i><span v-else>{{
            pageStringLast }}</span></button></li>
    </ul>
  </nav>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from "vue-i18n";



interface Props {
  currentPage: number,
  totalPages: number,
  maxPageLinks?: number,
  pagination?: boolean,

  showPageFirstLast?: boolean, // default false
  showPageIcons?: boolean, // default false
  pageStringFirst?: string, // default "First"
  pageStringLast?: string, // default "Last"
  pageStringPrev?: string, // default "Previous"
  pageStringNext?: string, // default "Next"
  alignment?: string, // default "justify-content-end", all CSS classes possible
  size?: string, // default use Bootstraps defaults, possible values: pagination-lg (large), pagination-sm (small)

}

const props = withDefaults(defineProps<Props>(), {
  pagination: true,
  //currentPage: 1,
  itemsPerPage: 6,
  maxPageLinks: 5,
  showPageFirstLast: false,
  showPageIcons: false,
  pageStringFirst: '',
  pageStringLast: '',
  pageStringPrev: '',
  pageStringNext: '',
  alignment: 'justify-content-end',
  size: '',
});


const { t } = useI18n();

const pageStringFirst = computed(() => props.pageStringFirst || t("pagination.first"));
const pageStringLast = computed(() => props.pageStringLast || t("pagination.last"));
const pageStringPrev = computed(() => props.pageStringPrev || t("pagination.previous"));
const pageStringNext = computed(() => props.pageStringNext || t("pagination.next"));

const emit = defineEmits<{
  (e: 'page-change', newPage: number): void
}>()

function emitPage(page: number) {
  emit('page-change', page)
}

const currentPage = computed(() => props.currentPage || 1);


function getPaginationClasses() {
  let classes = 'pagination';
  classes += ((props.alignment != '') ? ' ' + props.alignment : '');
  classes += ((props.size != '') ? ' ' + props.size : '');

  return classes;
}

function getPageClasses(page: number) {
  let pageItemClass = "page-item";
  if (page == currentPage.value) {
    // add active state
    pageItemClass += " active";
  }
  return pageItemClass;
}


function getPrevPage(current: number) {
  return (current - 1 < 1 ? 1 : current - 1);
}

function getNextPage(current: number) {
  if (current + 1 > props.totalPages) {
    return props.totalPages;
  }
  return current + 1;
}


function paginationRange() {
  let r = [];
  let maxPageLinksShown = props.maxPageLinks;
  if (props.totalPages < maxPageLinksShown) {
    maxPageLinksShown = props.totalPages;
  }

  let startRange = currentPage.value - (Math.floor(maxPageLinksShown / 2));
  if (startRange < 1) {
    startRange = 1;
  }
  let endRange = currentPage.value + (Math.floor(maxPageLinksShown / 2));
  if (endRange > props.totalPages) {
    endRange = props.totalPages;
  } else if (endRange < maxPageLinksShown) {
    endRange = maxPageLinksShown;
  }
  if (endRange - startRange + 1 < maxPageLinksShown) {
    startRange = endRange - maxPageLinksShown + 1;
  }
  r = Array.from({ length: endRange - startRange + 1 }, (_, index) => index + startRange);
  return r;

}

</script>
