export interface TErrorSource {
  path: string;
  message: string;
}

export interface TErrorResponse {
  statusCode?: number;
  ok: boolean;
  message: string;
  errorSource: TErrorSource[];
  error?: unknown;
}
