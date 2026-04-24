export type DepotRole = "owner" | "editor" | "viewer";

export type DepotAccess = {
  EntityType: string;
  EntityID: number;
  UserID: number;
  Role: DepotRole;
};

export type AddDepotAccessPayload = { UserID: number; Role: DepotRole };
export type ChangeDepotAccessPayload = { UserID: number; Role: DepotRole };
export type RemoveDepotAccessPayload = { UserID: number };

export type Depot = {
  ID: number;
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
  ContextGroupID: number;
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
