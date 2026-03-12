export type User = {
  ID: number;
  Email: string;
  FirstName: string;
  LastName: string;
  Password?: string;
  PasswordConfirm?: string;
  [key: string]: unknown;
};

export type CreateUserPayload = {
  FirstName: string;
  LastName: string;
  Email: string;
  Password: string;
  PasswordConfirm: string;
};

export type UpdateUserPayload = {
  ID: number;
  FirstName: string;
  LastName: string;
  Email: string;
};

export type UpdateUserPasswordPayload = {
  ID: number;
  Password: string;
  PasswordDuplicate: string;
};
