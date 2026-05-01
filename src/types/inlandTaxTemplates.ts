export type InlandTaxTemplateField = {
  Code: string;
  Label: string;
  Currency: string;
  SortOrder: number;
};

export type InlandTaxTemplate = {
  Template: string;
  Label: string;
  Currency: string;
  Fields: InlandTaxTemplateField[];
};
