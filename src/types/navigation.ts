export type SidebarItemType = "main" | "item" | "subitem";

export type SidebarItem = {
  title: string;
  type: SidebarItemType;
  icon?: string;
  url?: string;
  sub?: SidebarItem[];
  show?: boolean;
};
