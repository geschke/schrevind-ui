import { defineStore } from "pinia";
import axios from "@/helper/axiosInstance";
import { useUserAuthStore } from "@/stores/userauth";
import type { CreateDividendEntryPayload } from "@/types/dividendEntries";

function getCurrentUserIdOrThrow(): number {
  const storeUserAuth = useUserAuthStore();
  const rawUserId = storeUserAuth.getUserId;
  const userId = typeof rawUserId === "string" ? Number(rawUserId) : rawUserId;

  if (!Number.isInteger(userId) || userId <= 0) {
    throw new Error("UNAUTHORIZED");
  }

  return userId;
}

export const useDividendEntriesStore = defineStore("dividendEntries", () => {
  async function addDividendEntry(payload: CreateDividendEntryPayload) {
    const currentUserId = getCurrentUserIdOrThrow();
    const dividendEntryDO = {
      UserID: currentUserId,
      DepotID: payload.DepotID,
      SecurityID: payload.SecurityID,
      PayDate: payload.PayDate,
      ExDate: payload.ExDate,
      SecurityName: payload.SecurityName,
      SecurityISIN: payload.SecurityISIN,
      SecurityWKN: payload.SecurityWKN,
      SecuritySymbol: payload.SecuritySymbol,
      Quantity: payload.Quantity,
      DividendPerUnitAmount: payload.DividendPerUnitAmount,
      DividendPerUnitCurrency: payload.DividendPerUnitCurrency,
      FXRateLabel: payload.FXRateLabel,
      FXRate: payload.FXRate,
      GrossAmount: payload.GrossAmount,
      GrossCurrency: payload.GrossCurrency,
      PayoutAmount: payload.PayoutAmount,
      PayoutCurrency: payload.PayoutCurrency,
      WithholdingTaxCountryCode: payload.WithholdingTaxCountryCode,
      WithholdingTaxPercent: payload.WithholdingTaxPercent,
      WithholdingTaxAmount: payload.WithholdingTaxAmount,
      WithholdingTaxCurrency: payload.WithholdingTaxCurrency,
      WithholdingTaxAmountCredit: payload.WithholdingTaxAmountCredit,
      WithholdingTaxAmountCreditCurrency: payload.WithholdingTaxAmountCreditCurrency,
      WithholdingTaxAmountRefundable: payload.WithholdingTaxAmountRefundable,
      WithholdingTaxAmountRefundableCurrency: payload.WithholdingTaxAmountRefundableCurrency,
      ForeignFeesAmount: payload.ForeignFeesAmount,
      ForeignFeesCurrency: payload.ForeignFeesCurrency,
      Note: payload.Note,
    };

    return axios.post("/dividend-entries/add", dividendEntryDO, { withCredentials: true }).catch((error: unknown) => {
      throw error;
    });
  }

  return {
    addDividendEntry,
  };
});
