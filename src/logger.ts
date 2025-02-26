
/**
 * @see https://cloud.google.com/logging/docs/reference/v2/rest/v2/LogEntry#LogSeverity
 */ 
export enum LogSeverity {
  DEFAULT = 0,
  DEBUG = 100,
  INFO = 200,
  NOTICE = 300,
  WARNING = 400,
  ERROR = 500,
  CRITICAL = 600,
  ALERT = 700,
  EMERGENCY = 800
};

export type LogSettings = {
  severity: LogSeverity
};

export interface Logger {
  logDebug(message: string, jsonPayload?: any): void;
  logInfo(message: string, jsonPayload?: any): void;
  logNotice(message: string, jsonPayload?: any): void;
  logWarning(message: string, jsonPayload?: any): void;
  logError(message: string, jsonPayload?: any): void;
}

export class DefaultLoggerImpl implements Logger {
  private readonly logSettings: LogSettings;

  constructor(logSettings: LogSettings = {
    severity: LogSeverity.DEFAULT
  }) {
    this.logSettings = logSettings;
  }

  logDebug(message: string, jsonPayload?: any): void {
    if(this.logSettings.severity <= LogSeverity.DEBUG) console.log(JSON.stringify({severity: "DEBUG", message, ...jsonPayload}))
  }
  logInfo(message: string, jsonPayload?: any): void {
    if(this.logSettings.severity <= LogSeverity.INFO) console.log(JSON.stringify({severity: "INFO", message, ...jsonPayload}))
  }
  logNotice(message: string, jsonPayload?: any): void {
    if(this.logSettings.severity <= LogSeverity.NOTICE) console.log(JSON.stringify({severity: "NOTICE", message, ...jsonPayload}))
  }
  logWarning(message: string, jsonPayload?: any): void {
    if(this.logSettings.severity <= LogSeverity.WARNING) console.warn(JSON.stringify({severity: "WARNING", message, ...jsonPayload}))
  }
  logError(message: string, jsonPayload?: any): void {
    if(this.logSettings.severity <= LogSeverity.ERROR) console.error(JSON.stringify({severity: "ERROR", message, ...jsonPayload}))
  }

}

export function errorFromUnknown(e: any): Error {
  if (e instanceof Error) return e;
  if (typeof e == "string") return new Error(e);
  if (typeof e?.message === 'string') return new Error(e.message);

  return new Error("Error of unknown shape")
}

export function errorMessageFromUnknown(e: any): string {
  return errorFromUnknown(e).toString();
}

export function createDefaultLogger() {
  return new DefaultLoggerImpl();
}