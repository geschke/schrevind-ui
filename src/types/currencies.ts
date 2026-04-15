export type Currency = {
  ID: number;
  Currency: string;
  Name: string;
  DecimalPlaces: number | null;
  Status: string;
  CreatedAt: number;
  UpdatedAt: number;
  [key: string]: unknown;
};

export type CreateCurrencyPayload = {
  Currency: string;
  Name: string;
  DecimalPlaces?: number;
  Status: string;
};

export type UpdateCurrencyPayload = {
  ID: number;
  Currency: string;
  Name: string;
  DecimalPlaces?: number;
  Status: string;
};
