export type WithholdingTaxDefault = {
  ID: number;
  DepotID: number;
  CountryCode: string;
  CountryName: string;
  WithholdingTaxPercentDefault: string;
  WithholdingTaxPercentCreditDefault: string;
  CreatedAt: number;
  UpdatedAt: number;
  [key: string]: unknown;
};

export type CreateWithholdingTaxDefaultPayload = {
  DepotID: number;
  CountryCode: string;
  CountryName: string;
  WithholdingTaxPercentDefault: string;
  WithholdingTaxPercentCreditDefault: string;
};

export type UpdateWithholdingTaxDefaultPayload = {
  ID: number;
  DepotID: number;
  CountryCode: string;
  CountryName: string;
  WithholdingTaxPercentDefault: string;
  WithholdingTaxPercentCreditDefault: string;
};
