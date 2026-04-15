export type User = {
  ID: number;
  Email: string;
  FirstName: string;
  LastName: string;
  Locale: string;
  Password?: string;
  PasswordConfirm?: string;
  // GroupCount is optionally returned by the backend to indicate group membership.
  // 0 or absent means the user belongs to no group ("naked user").
  GroupCount?: number;
  [key: string]: unknown;
};

export type CreateUserPayload = {
  GroupID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Locale: string;
  Password: string;
  PasswordConfirm: string;
};

export type UpdateUserPayload = {
  GroupID: number;
  ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
  Locale: string;
};

export type UpdateUserPasswordPayload = {
  GroupID: number;
  ID: number;
  Password: string;
  PasswordDuplicate: string;
};

export type DeleteUserPayload = {
  GroupID: number;
  ID: number;
};
