export type Security = {
  ID: number;
  Name: string;
  ISIN: string;
  WKN: string;
  Symbol: string;
  Status: string;
  CreatedAt: number;
  UpdatedAt: number;
  [key: string]: unknown;
};

export type CreateSecurityPayload = {
  Name: string;
  ISIN: string;
  WKN: string;
  Symbol: string;
  Status: string;
};

export type UpdateSecurityPayload = {
  ID: number;
  Name: string;
  ISIN: string;
  WKN: string;
  Symbol: string;
  Status: string;
};
