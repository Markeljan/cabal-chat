import { logAgentDetails } from "@/helpers/client";
import { getXmtpClient } from "@/helpers/get-client";
import { createServer } from "@/lib/server";
import { XMTPHandler } from "@/lib/xmtp";

async function main() {
  const client = await getXmtpClient();
  void logAgentDetails(client);

  const xmtpHandler = new XMTPHandler(client);
  await xmtpHandler.initialize();

  const app = createServer(xmtpHandler);

  app.listen(3131, () => {
    console.log("🚀 Elysia server running on http://localhost:3131");
  });

  await xmtpHandler.startMessageStream();
}

main().catch(console.error);
