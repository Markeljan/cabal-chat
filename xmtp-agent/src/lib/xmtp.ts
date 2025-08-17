import { ContentTypeWalletSendCalls } from "@xmtp/content-type-wallet-send-calls";
import type { Conversation, DecodedMessage } from "@xmtp/node-sdk";
import type { XMTPClient, XMTPClientContentTypes } from "@/helpers/get-client";
import { promptAgent } from "@/lib/ai";
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

  private isEthereumAddress(text: string): string | null {
    const ethAddressRegex = /\b(0x[a-fA-F0-9]{40})\b/;
    const match = text.match(ethAddressRegex);
    return match ? match[1] : null;
  }

  private async handleMessage(message: DecodedMessage<XMTPClientContentTypes>) {
    if (
      message.senderInboxId.toLowerCase() === this.client.inboxId.toLowerCase()
    ) {
      return;
    }

    if (message.contentType?.typeId !== "text") {
      return;
    }

    console.log(
      `Received message: ${message.content} by ${message.senderInboxId}`,
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

    const messageContent = message.content;

    // Skip non text messages (walletsendcalls, transaction references, and group updates)
    if (!messageContent || typeof messageContent !== "string") {
      console.log("Missing or non-text message content, skipping");
      return;
    }

    const trimmedContent = messageContent.trim();

    // Check if message starts with a slash command
    if (trimmedContent.startsWith("/")) {
      try {
        console.log("Processing command:", trimmedContent);
        await this.processCommand(trimmedContent, conversation, memberAddress);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        console.error("Error processing command:", errorMessage);
        await conversation.send(
          "Sorry, I encountered an error processing your command.",
        );
      }
    } else {
      // Check if message contains an Ethereum address
      const ethAddress = this.isEthereumAddress(trimmedContent);
      if (ethAddress) {
        console.log("Found Ethereum address:", ethAddress);
        await conversation.send(`https://cabalchat.xyz/token/${ethAddress}`);
      } else {
        // If not a command or address, prompt the agent
        console.log("Prompting agent with message:", messageContent);
        const result = await promptAgent(messageContent);

        await conversation.send(result.text);
      }
    }
  }

  private async processCommand(
    input: string,
    conversation: Conversation,
    memberAddress: string,
  ) {
    const command = input.toLowerCase();

    // Define valid commands and their handlers
    if (command === "/balance") {
      await this.handleBalanceCommand(conversation, memberAddress);
    } else if (command.startsWith("/tx ")) {
      await this.handleTransactionCommand(command, conversation, memberAddress);
    } else {
      // Any invalid command (including /help) shows the help message
      await this.showHelp(conversation);
    }
  }

  private async handleBalanceCommand(
    conversation: Conversation,
    memberAddress: string,
  ) {
    const result = await this.usdcHandler.getUSDCBalance(memberAddress);
    await conversation.send(`Your USDC balance is: ${result} USDC`);
  }

  private async handleTransactionCommand(
    command: string,
    conversation: Conversation,
    memberAddress: string,
  ) {
    const parts = command.split(" ");
    const amount = parseFloat(parts[1]);

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
  }

  private async showHelp(conversation: Conversation) {
    await conversation.send(
      "Available commands:\n" +
        "/balance - Check your USDC balance\n" +
        "/tx <amount> - Send USDC to the agent (e.g. /tx 0.1)\n" +
        "/help - Show this help message",
    );
  }

  getClient() {
    return this.client;
  }
}
