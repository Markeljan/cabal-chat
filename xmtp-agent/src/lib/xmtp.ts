import { ContentTypeWalletSendCalls } from "@xmtp/content-type-wallet-send-calls";
import type { Conversation, DecodedMessage } from "@xmtp/node-sdk";
import type { XMTPClient } from "@/helpers/get-client";
import { USDCHandler } from "@/lib/usdc";

export class XMTPHandler {
  private client: XMTPClient;
  private usdcHandler: USDCHandler;

  constructor(client: XMTPClient) {
    this.client = client;
    this.usdcHandler = new USDCHandler();
  }

  async initialize() {
    console.log("✓ Syncing conversations...");
    await this.client.conversations.sync();
    console.log("Waiting for messages...");
  }

  async startMessageStream() {
    const stream = await this.client.conversations.streamAllMessages();

    for await (const message of stream) {
      await this.handleMessage(message);
    }
  }

  private async handleMessage(message: DecodedMessage) {
    if (
      message.senderInboxId.toLowerCase() === this.client.inboxId.toLowerCase()
    ) {
      return;
    }

    if (message.contentType?.typeId !== "text") {
      return;
    }

    console.log(
      `Received message: ${message.content as string} by ${message.senderInboxId}`,
    );

    const conversation = await this.client.conversations.getConversationById(
      message.conversationId,
    );

    if (!conversation) {
      console.log("Unable to find conversation, skipping");
      return;
    }

    const inboxState = await this.client.preferences.inboxStateFromInboxIds([
      message.senderInboxId,
    ]);
    const memberAddress = inboxState[0].identifiers[0].identifier;
    if (!memberAddress) {
      console.log("Unable to find member address, skipping");
      return;
    }

    const messageContent = message.content as string;
    const command = messageContent.toLowerCase().trim();

    try {
      await this.processCommand(command, conversation, memberAddress);
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.error("Error processing command:", errorMessage);
      await conversation.send(
        "Sorry, I encountered an error processing your command.",
      );
    }
  }

  private async processCommand(
    command: string,
    conversation: Conversation,
    memberAddress: string,
  ) {
    if (command === "/balance") {
      const result = await this.usdcHandler.getUSDCBalance(memberAddress);
      await conversation.send(`Your USDC balance is: ${result} USDC`);
    } else if (command.startsWith("/tx ")) {
      const amount = parseFloat(command.split(" ")[1]);
      if (Number.isNaN(amount) || amount <= 0) {
        await conversation.send(
          "Please provide a valid amount. Usage: /tx <amount>",
        );
        return;
      }

      const amountInDecimals = Math.floor(amount * 10 ** 6);

      const walletSendCalls = this.usdcHandler.createUSDCTransferCalls({
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
  }

  getClient() {
    return this.client;
  }
}
