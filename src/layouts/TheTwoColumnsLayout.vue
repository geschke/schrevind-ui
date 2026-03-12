<template>
  <div class="container-fluid" :class="containerClasses">
    <div class="row" :class="rowClasses">
      <div :class="leftColumnClasses">
        <slot name="leftCol">
          <h1>{{ t("twoColumns.left") }}</h1>
        </slot>
      </div>
      <div :class="rightColumnClasses">
        <slot name="rightCol">
          <h1>{{ t("twoColumns.right") }}</h1>
        </slot>
      </div>
    </div>
  </div>
</template>

<script>
import { useI18n } from "vue-i18n";
export default {
  name: "TheTwoColumnsLayout",
  setup() {
    const { t } = useI18n();
    return { t };
  },
  props: {
    leftColumnClass: {
      type: String,
      default: "col-md-8",
    },
    rightColumnClass: {
      type: String,
      default: "col-md-4",
    },
    fullsize: {
      type: Boolean,
      default: false,
    },
  },
  computed: {
    leftColumnClasses() {
      return [this.leftColumnClass, this.fullsize ? "h-100" : ""];
    },
    rightColumnClasses() {
      return [this.rightColumnClass, this.fullsize ? "h-100" : ""];
    },
    rowClasses() {
      return [this.fullsize ? "h-100" : ""]; // height: 100%
    },
    containerClasses() {
      return [this.fullsize ? "vh-100" : ""]; // view-height
    },
  },
};
</script>

<style scoped></style>
