import { CdpClient } from "@coinbase/cdp-sdk";

const DEFAULT_NETWORK = "base-mainnet";
const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export class BalanceService {
  private cdp: CdpClient;
  private network: string;

  constructor(network: string = DEFAULT_NETWORK) {
    this.cdp = new CdpClient();
    this.network = network;
  }

  async getTokenBalance(address: string, tokenAddress: string = USDC_ADDRESS) {
    const result = await this.cdp.evm.listTokenBalances({
      address,
      network: this.network,
      contractAddresses: [tokenAddress],
    });

    const balanceInfo = result.balances[0];
    return {
      amount: balanceInfo?.amount.amount ?? "0",
      symbol: balanceInfo?.token.symbol ?? "",
      tokenAddress,
    };
  }
}

export { USDC_ADDRESS };
