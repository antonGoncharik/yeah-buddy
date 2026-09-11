export interface ConfirmOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
}

export interface PromptOptions {
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  placeholder?: string;
  defaultValue?: string;
}

export type ConfirmFn = (options: ConfirmOptions | string) => Promise<boolean>;
export type PromptFn = (options: PromptOptions) => Promise<string | null>;
