// GroupRole describes the role a user can have within a group.
// An empty string means the user is a group member without an explicit role.
export type GroupRole = "owner" | "admin" | "editor" | "viewer" | "";

// UserGroup is the group entry returned inside the login / /auth/me response.
export type UserGroup = {
  ID: number;
  Name: string;
  Role: GroupRole;
};

export type Group = {
  ID: number;
  Name: string;
  CreatedAt: number;
  UpdatedAt: number;
  [key: string]: unknown;
};

export type CreateGroupPayload = {
  Name: string;
};

export type UpdateGroupPayload = {
  ID: number;
  Name: string;
};

export type GroupMemberPayload = {
  UserIDs: number[];
};
