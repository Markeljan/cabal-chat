import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import {
  ContentTypeWalletSendCalls,
  WalletSendCallsCodec,
} from "@xmtp/content-type-wallet-send-calls";
import { Client } from "@xmtp/node-sdk";
import {
  createSigner,
  getDbPath,
  getEncryptionKeyFromHex,
  logAgentDetails,
} from "@/helpers/client";
import { ENCRYPTION_KEY, WALLET_KEY, XMTP_ENV } from "@/lib/config";
import { USDCHandler } from "@/lib/usdc";

/* Create the signer using viem and parse the encryption key for the local db */
const signer = createSigner(WALLET_KEY);
const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);

/* Initialize the xmtp client */
export const client = await Client.create(signer, {
  dbEncryptionKey,
  env: XMTP_ENV,
  codecs: [new WalletSendCallsCodec(), new TransactionReferenceCodec()],
  dbPath: getDbPath("xmtp"),
});

async function main() {
  const usdcHandler = new USDCHandler();

  // const identifier = await signer.getIdentifier();
  // const agentAddress = identifier.identifier;
  void logAgentDetails(client);

  /* Sync the conversations from the network to update the local db */
  console.log("✓ Syncing conversations...");
  await client.conversations.sync();

  console.log("Waiting for messages...");
  /* Stream all messages from the network */
  const stream = await client.conversations.streamAllMessages();

  for await (const message of stream) {
    /* Ignore messages from the same agent or non-text messages */
    if (message.senderInboxId.toLowerCase() === client.inboxId.toLowerCase()) {
      continue;
    }

    /* Ignore non-text messages */
    if (message.contentType?.typeId !== "text") {
      continue;
    }

    console.log(
      `Received message: ${message.content as string} by ${message.senderInboxId}`,
    );

    /* Get the conversation by id */
    const conversation = await client.conversations.getConversationById(
      message.conversationId,
    );

    if (!conversation) {
      console.log("Unable to find conversation, skipping");
      continue;
    }

    const inboxState = await client.preferences.inboxStateFromInboxIds([
      message.senderInboxId,
    ]);
    const memberAddress = inboxState[0].identifiers[0].identifier;
    if (!memberAddress) {
      console.log("Unable to find member address, skipping");
      continue;
    }

    const messageContent = message.content as string;
    const command = messageContent.toLowerCase().trim();

    try {
      if (command === "/balance") {
        const result = await usdcHandler.getUSDCBalance(memberAddress);

        await conversation.send(`Your USDC balance is: ${result} USDC`);
      } else if (command.startsWith("/tx ")) {
        const amount = parseFloat(command.split(" ")[1]);
        if (Number.isNaN(amount) || amount <= 0) {
          await conversation.send(
            "Please provide a valid amount. Usage: /tx <amount>",
          );
          continue;
        }

        // Convert amount to USDC decimals (6 decimal places)
        const amountInDecimals = Math.floor(amount * 10 ** 6);

        const walletSendCalls = usdcHandler.createUSDCTransferCalls({
          recipientAddress: memberAddress,
          amount: amountInDecimals,
        });

        console.log("Replied with wallet sendcall");
        await conversation.send(walletSendCalls, ContentTypeWalletSendCalls);
      } else {
        await conversation.send(
          "Available commands:\n" +
            "/balance - Check your USDC balance\n" +
            "/tx <amount> - Send USDC to the agent (e.g. /tx 0.1)",
        );
      }
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error processing command:", errorMessage);
      await conversation.send(
        "Sorry, I encountered an error processing your command.",
      );
    }
  }
}

main().catch(console.error);
