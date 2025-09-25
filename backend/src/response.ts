import { ServerResponse } from "http";

interface ResponseOptions {
  title: string;
  message: string;
  data?: any;
  statusCode?: number; // opsiyonel HTTP kodu, default 200
}

export function response(res: ServerResponse, options: ResponseOptions) {
  const { title, message, data = null, statusCode = 200 } = options;

  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify({
    title,
    message,
    data
  }));
}
