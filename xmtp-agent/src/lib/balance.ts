import { CdpClient } from "@coinbase/cdp-sdk";

const USDC_ADDRESS = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913";

export class BalanceService {
  private cdp: CdpClient;

  constructor() {
    this.cdp = new CdpClient();
  }

  async getTokenBalance(
    address: `0x${string}`,
    tokenAddress: `0x${string}` = USDC_ADDRESS,
  ) {
    const result = await this.cdp.evm.listTokenBalances({
      address,
      network: "base",
    });

    const balanceInfo = result.balances.find(
      (balance) => balance.token.contractAddress === tokenAddress,
    );

    return {
      amount: balanceInfo?.amount.amount ?? "0",
      symbol: balanceInfo?.token.symbol ?? "",
      tokenAddress,
    };
  }
}

export { USDC_ADDRESS };
