import { ContentTypeWalletSendCalls } from "@xmtp/content-type-wallet-send-calls";
import type { Conversation, DecodedMessage } from "@xmtp/node-sdk";
import type { XMTPClient, XMTPClientContentTypes } from "@/helpers/get-client";
import { promptAgent } from "@/lib/ai";
import { BalanceService } from "@/lib/balance";
import { swapHandler } from "@/lib/swap-handler";
import { USDCHandler } from "@/lib/usdc";

export class XMTPHandler {
  private client: XMTPClient;
  private usdcHandler: USDCHandler;
  private balanceService: BalanceService;

  constructor(client: XMTPClient) {
    this.client = client;
    this.usdcHandler = new USDCHandler();
    this.balanceService = new BalanceService();
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

        // Get group ID if this is a group conversation
        const groupId =
          "topic" in conversation ? conversation.topic : undefined;

        // Store context for the AI agent
        const _context = {
          message: messageContent,
          senderAddress: memberAddress,
          groupId,
          conversationId: message.conversationId,
        };

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
    if (command.startsWith("/balance")) {
      await this.handleBalanceCommand(input, conversation, memberAddress);
    } else if (command.startsWith("/tx ")) {
      await this.handleTransactionCommand(command, conversation, memberAddress);
    } else if (command.startsWith("/swap")) {
      await this.handleSwapCommand(command, conversation, memberAddress);
    } else if (command === "/stats") {
      await this.handleStatsCommand(conversation, memberAddress);
    } else if (command === "/leaderboard") {
      await this.handleLeaderboardCommand(conversation);
    } else {
      // Any invalid command (including /help) shows the help message
      await this.showHelp(conversation);
    }
  }

  private async handleBalanceCommand(
    input: string,
    conversation: Conversation,
    memberAddress: string,
  ) {
    const parts = input.trim().split(/\s+/);
    let address = memberAddress;
    let tokenAddress: string | undefined;

    if (parts.length >= 2) {
      address = parts[1];
    }
    if (parts.length >= 3) {
      tokenAddress = parts[2];
    }

    const { amount, symbol } = await this.balanceService.getTokenBalance(
      address,
      tokenAddress,
    );
    await conversation.send(`Balance: ${amount} ${symbol}`);
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

  private async handleStatsCommand(
    conversation: Conversation,
    memberAddress: string,
  ) {
    const statsLink = swapHandler.generateStatsLink(memberAddress);
    const message = [
      "📊 View your trading stats:",
      "",
      `🔗 ${statsLink}`,
      "",
      "Track your swaps, PnL, and ranking on the leaderboard!",
    ].join("\n");

    await conversation.send(message);
  }

  private async handleLeaderboardCommand(conversation: Conversation) {
    const leaderboardLink = swapHandler.generateLeaderboardLink();
    const message = [
      "🏆 View the trading leaderboard:",
      "",
      `🔗 ${leaderboardLink}`,
      "",
      "See top traders by volume, PnL, and more!",
    ].join("\n");

    await conversation.send(message);
  }

  private async handleSwapCommand(
    command: string,
    conversation: Conversation,
    memberAddress: string,
  ) {
    const groupId = "topic" in conversation ? conversation.topic : undefined;
    const { link, message } = swapHandler.parseSwapCommand(
      command,
      memberAddress,
      groupId?.toString(),
    );

    const fullMessage = [message, "", `🔗 ${link}`].join("\n");

    await conversation.send(fullMessage);
  }

  private async showHelp(conversation: Conversation) {
    const helpMessage = [
      "Available commands:",
      "",
      "/balance [address] [token] - Check a token balance",
      "/tx <amount> - Get a transaction to receive USDC",
      "/swap - Start swapping tokens",
      "/swap <amount> <from> to <to> - Quick swap (e.g. /swap 100 USDC to ETH)",
      "/stats - View your trading stats",
      "/leaderboard - View top traders",
      "/help - Show this help message",
    ].join("\n");
    await conversation.send(helpMessage);
  }

  getClient() {
    return this.client;
  }
}
