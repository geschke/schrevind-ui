declare module "goar-components" {
  export const GoarComponents: any;
  export const GTable: any;
  export const GToast: any;
  export const GToastSuccess: Record<string, unknown>;
  export const GToastWarning: Record<string, unknown>;
  export const GToastInfo: Record<string, unknown>;
  export const GToastDanger: Record<string, unknown>;

  export type GTableHeader = Record<string, unknown>;
  export type GToastContent = Record<string, unknown>;
}

declare module "bootstrap" {
  export class Modal {
    constructor(element: string | Element, options?: Record<string, unknown>);
    show(): void;
    hide(): void;
  }
}
