import { Elysia } from "elysia";
import type { XMTPHandler } from "@/lib/xmtp";

export function createServer(xmtpHandler: XMTPHandler) {
  const app = new Elysia()
    .get("/", () => "XMTP Agent Server")
    .get("/health", () => ({
      status: "ok",
      timestamp: new Date().toISOString(),
    }))
    .get("/client", () => {
      const client = xmtpHandler.getClient();
      return {
        inboxId: client.inboxId,
        installationId: client.installationId,
        accountIdentifier: client.accountIdentifier?.identifier,
      };
    });

  return app;
}
