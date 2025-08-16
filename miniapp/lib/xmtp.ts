"use client";

import { Client, type Signer } from "@xmtp/browser-sdk";
import { toBytes, type WalletClient } from "viem";

export class XMTPService {
  private static instance: XMTPService;
  private client: Client | null = null;

  private constructor() {}

  static getInstance(): XMTPService {
    if (!XMTPService.instance) {
      XMTPService.instance = new XMTPService();
    }
    return XMTPService.instance;
  }

  private createSigner(walletClient: WalletClient) {
    const address = walletClient.account?.address;
    const chainId = walletClient.chain?.id;

    if (!address || !chainId) {
      throw new Error("Invalid wallet client");
    }

    const signer: Signer = {
      type: "SCW" as const,
      getIdentifier: () => ({
        identifier: address.toLowerCase(),
        identifierKind: "Ethereum",
      }),
      signMessage: async (message: string) => {
        const signature = await walletClient.signMessage({
          account: address,
          message,
        });
        return toBytes(signature);
      },
      getChainId: () => {
        return BigInt(chainId);
      },
    };

    return signer;
  }

  async hasExistingIdentity(walletClient: WalletClient): Promise<boolean> {
    try {
      const address = walletClient.account?.address.toLowerCase();
      if (!address) return false;

      const result = await Client.canMessage(
        [{ identifier: address, identifierKind: "Ethereum" }],
        "production",
      );
      return result.get(address.toLowerCase()) || false;
    } catch (error) {
      console.error("Error checking existing identity:", error);
      return false;
    }
  }

  async createClient(walletClient: WalletClient): Promise<Client> {
    try {
      if (this.client) {
        return this.client;
      }

      const signer = this.createSigner(walletClient);

      this.client = await Client.create(signer, {
        env: "production",
      });

      return this.client;
    } catch (error) {
      console.error("Error creating XMTP client:", error);
      throw error;
    }
  }

  getClient(): Client | null {
    return this.client;
  }

  disconnect(): void {
    this.client = null;
  }
}

export const xmtpService = XMTPService.getInstance();
