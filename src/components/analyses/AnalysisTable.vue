<template>
  <div class="table-responsive">
    <table class="table table-striped table-hover mb-0">
      <thead class="table-secondary">
        <tr>
          <th v-for="column in analysis.columns" :key="column.key" :class="cellClass(column)">
            {{ t(column.label_key) }}
          </th>
        </tr>
      </thead>
      <tbody class="table-group-divider">
        <tr v-if="analysis.rows.length === 0 || analysis.columns.length === 0">
          <td :colspan="analysis.columns.length || 1" class="text-center">
            <i class="bi bi-inbox"></i> {{ t("analyses.common.empty") }}
          </td>
        </tr>
        <template v-else>
          <tr v-for="(row, rowIndex) in analysis.rows" :key="rowIndex">
            <td v-for="column in analysis.columns" :key="column.key" :class="cellClass(column)">
              {{ formatCell(row[column.key], column) }}
            </td>
          </tr>
        </template>
      </tbody>
    </table>
  </div>
</template>

<script setup lang="ts">
import type { AnalysisTable, AnalysisTableColumn } from "@/types/analyses";
import { useI18n } from "vue-i18n";

interface Props {
  analysis: AnalysisTable;
}

defineProps<Props>();

const { t } = useI18n();

function cellClass(column: AnalysisTableColumn): string {
  return column.align === "right" ? "text-end" : "text-start";
}

function formatCell(value: unknown, column: AnalysisTableColumn): string {
  const normalizedValue = value === null || value === undefined ? "" : String(value);

  if (normalizedValue.trim() === "") {
    return "-";
  }

  if (column.datatype === "currency" && column.currency) {
    return `${normalizedValue} ${column.currency}`;
  }

  return normalizedValue;
}
</script>

<style scoped></style>
