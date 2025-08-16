import type { XmtpEnv } from "@xmtp/node-sdk";
import { validateEnvironment } from "@/helpers/client";

const VALID_ENVS = validateEnvironment([
  "WALLET_KEY",
  "ENCRYPTION_KEY",
  "XMTP_ENV",
]);

export const { WALLET_KEY, ENCRYPTION_KEY } = VALID_ENVS;
// typed XMTP_ENV to avoid type errors
export const { XMTP_ENV } = VALID_ENVS as { XMTP_ENV: XmtpEnv };
