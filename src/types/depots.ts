export type Depot = {
  ID: number;
  UserID: number;
  Name: string;
  BrokerName: string;
  AccountNumber: string;
  BaseCurrency: string;
  Description: string;
  Status: string;
  CreatedAt: number;
  UpdatedAt: number;
  [key: string]: unknown;
};

export type CreateDepotPayload = {
  Name: string;
  BrokerName: string;
  AccountNumber: string;
  BaseCurrency: string;
  Description: string;
  Status: string;
};

export type UpdateDepotPayload = {
  ID: number;
  Name: string;
  BrokerName: string;
  AccountNumber: string;
  BaseCurrency: string;
  Description: string;
  Status: string;
};
