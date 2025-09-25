import * as http from "http";
import { IncomingMessage, ServerResponse } from "http";

type Handler = (req: IncomingMessage & { body?: any }, res: ServerResponse) => void;

class API {
  private routes: { method: string; path: string; handler: Handler }[] = [];

  get(path: string, handler: Handler) {
    this.routes.push({ method: "GET", path, handler });
  }

  post(path: string, handler: Handler) {
    this.routes.push({ method: "POST", path, handler });
  }

  put(path: string, handler: Handler) {
    this.routes.push({ method: "PUT", path, handler });
  }

  delete(path: string, handler: Handler) {
    this.routes.push({ method: "DELETE", path, handler });
  }

  listen(port: number, cb?: () => void) {
    const server = http.createServer((req, res) => {
      const match = this.routes.find(
        (r) => r.method === req.method && r.path === req.url
      );

      if (match) {
        // Body parse etme (sadece POST ve PUT için)
        if (req.method === "POST" || req.method === "PUT") {
          let body = "";
          req.on("data", (chunk) => {
            body += chunk;
          });

          req.on("end", () => {
            try {
              if (body) {
                (req as any).body = JSON.parse(body);
              }
            } catch (err) {
              res.writeHead(400, { "Content-Type": "application/json" });
              res.end(JSON.stringify({ error: "Invalid JSON" }));
              return;
            }

            match.handler(req as IncomingMessage & { body: any }, res);
          });
        } else {
          match.handler(req as IncomingMessage & { body?: any }, res);
        }
      } else {
        res.writeHead(404, { "Content-Type": "text/plain" });
        res.end("Not Found");
      }
    });

    server.listen(port, cb);
  }
}

export const api = new API();
