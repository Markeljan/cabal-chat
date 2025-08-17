import { CdpClient } from "@coinbase/cdp-sdk";
import { tool } from "ai";
import { z } from "zod";

const cdp = new CdpClient();

type SwapQuoteResult = Awaited<ReturnType<typeof cdp.evm.createSwapQuote>>;

// Define sub-schemas for nested objects
const protocolFeeSchema = z.object({
	amount: z.string(),
	token: z.string(),
});

const feesSchema = z.object({
	protocolFee: protocolFeeSchema,
});

const allowanceIssueSchema = z.object({
	currentAllowance: z.string(),
	spender: z.string(),
});

const balanceIssueSchema = z.object({
	token: z.string(),
	currentBalance: z.string(),
	requiredBalance: z.string(),
});

const issuesSchema = z.object({
	allowance: allowanceIssueSchema,
	balance: balanceIssueSchema,
	simulationIncomplete: z.boolean(),
});

const transactionSchema = z.object({
	to: z.string(),
	data: z.string(),
	value: z.string(),
	gas: z.string(),
	gasPrice: z.string(),
});

const eip712DomainSchema = z.object({
	chainId: z.number(),
	name: z.string(),
	verifyingContract: z.string(),
});

const eip712TypeFieldSchema = z.object({
	name: z.string(),
	type: z.string(),
});

const eip712TypesSchema = z.object({
	EIP712Domain: z.array(eip712TypeFieldSchema),
	PermitTransferFrom: z.array(eip712TypeFieldSchema),
	TokenPermissions: z.array(eip712TypeFieldSchema),
});

const tokenPermissionsSchema = z.object({
	amount: z.string(),
	token: z.string(),
});

const permitMessageSchema = z.object({
	deadline: z.string(),
	nonce: z.string(),
	permitted: tokenPermissionsSchema,
	spender: z.string(),
});

const eip712Schema = z.object({
	domain: eip712DomainSchema,
	types: eip712TypesSchema,
	primaryType: z.string(),
	message: permitMessageSchema,
});

const permit2Schema = z.object({
	eip712: eip712Schema,
});

// Main swap quote schema
const SwapQuoteSchema = z
	.object({
		liquidityAvailable: z.boolean(),
		network: z.string(),
		toToken: z.string(),
		fromToken: z.string(),
		fromAmount: z.string(),
		toAmount: z.string(),
		minToAmount: z.string(),
		blockNumber: z.string(),
		fees: feesSchema,
		issues: issuesSchema,
		transaction: transactionSchema,
		permit2: permit2Schema,
	})
	.or(
		z.object({
			liquidityAvailable: z.boolean(),
		}),
	);

const coerceHexString = (val: string): `0x${string}` => {
	// test if val starts with 0x
	if (val.startsWith("0x")) {
		return val as `0x${string}`;
	}
	throw new Error("Invalid hex string");
};

// Type inference
const SwapToolInputSchema = z.object({
	fromToken: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
	toToken: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
	fromAmount: z.string(),
	taker: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
});

export const createSwapQuoteTool = tool({
	description: "Create a swap quote for a given token pair and amount",
	inputSchema: SwapToolInputSchema,
	outputSchema: SwapQuoteSchema,
	execute: async ({
		fromToken,
		toToken,
		fromAmount,
		taker,
	}): Promise<SwapQuoteResult> => {
		const swapQuote = await cdp.evm.createSwapQuote({
			fromToken: fromToken as `0x${string}`,
			toToken: toToken as `0x${string}`,
			fromAmount: BigInt(fromAmount),
			taker: taker as `0x${string}`,
			network: "base",
		});

		return swapQuote;
	},
});
