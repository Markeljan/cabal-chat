import type { WalletSendCallsParams } from "@xmtp/content-type-wallet-send-calls";
import { createPublicClient, formatUnits, http, toHex } from "viem";
import { base } from "viem/chains";

// Network configuration type
export type NetworkConfig = {
  tokenAddress: string;
  chainId: `0x${string}`;
  decimals: number;
  networkName: string;
  networkId: string;
};

// Available network configurations
export const USDC_CONFIG: NetworkConfig = {
  tokenAddress: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", // USDC on Base Mainnet
  chainId: toHex(8453), // Base Mainnet network ID (8453 in hex)
  decimals: 6,
  networkName: "Base Mainnet",
  networkId: "base-mainnet",
};

// ERC20 minimal ABI for balance checking
const erc20Abi = [
  {
    inputs: [{ name: "account", type: "address" }],
    name: "balanceOf",
    outputs: [{ name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
] as const;

export class USDCHandler {
  private networkConfig: NetworkConfig;
  private publicClient;

  constructor() {
    this.networkConfig = USDC_CONFIG;
    this.publicClient = createPublicClient({
      chain: base,
      transport: http(),
    });
  }

  /**
   * Get USDC balance for a given address
   */
  async getUSDCBalance(address: string): Promise<string> {
    const balance = await this.publicClient.readContract({
      address: this.networkConfig.tokenAddress as `0x${string}`,
      abi: erc20Abi,
      functionName: "balanceOf",
      args: [address as `0x${string}`],
    });

    return formatUnits(balance, this.networkConfig.decimals);
  }

  /**
   * Create wallet send calls parameters for USDC transfer
   */
  createUSDCTransferCalls(
    fromAddress: string,
    recipientAddress: string,
    amount: number,
  ): WalletSendCallsParams {
    const methodSignature = "0xa9059cbb"; // Function signature for ERC20 'transfer(address,uint256)'

    // Format the transaction data following ERC20 transfer standard
    const transactionData = `${methodSignature}${recipientAddress
      .slice(2)
      .padStart(64, "0")}${BigInt(amount).toString(16).padStart(64, "0")}`;

    return {
      version: "1.0",
      from: "0x", //" as `0x${string}`,
      chainId: this.networkConfig.chainId,
      calls: [
        {
          to: this.networkConfig.tokenAddress as `0x${string}`,
          data: transactionData as `0x${string}`,
          metadata: {
            description: `Transfer ${amount / 10 ** this.networkConfig.decimals} USDC on ${this.networkConfig.networkName}`,
            transactionType: "transfer",
            currency: "USDC",
            amount: amount.toString(),
            decimals: this.networkConfig.decimals.toString(),
            networkId: this.networkConfig.networkId,
          },
        },
        /* add more calls here */
      ],
    };
  }
}
