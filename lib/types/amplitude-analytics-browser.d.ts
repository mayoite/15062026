declare module "@amplitude/analytics-browser" {
  export interface InitOptions {
    defaultTracking?: {
      sessions?: boolean;
      pageViews?: boolean;
      formInteractions?: boolean;
      fileDownloads?: boolean;
    };
  }

  export class Identify {
    set(key: string, value: string): this;
  }

  export function init(apiKey: string, userId?: string, options?: InitOptions): void;
  export function track(
    eventName: string,
    properties?: Record<string, string | number | boolean>,
  ): void;
  export function setUserId(userId: string): void;
  export function identify(identity: Identify): void;
}
