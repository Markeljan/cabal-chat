import { TransactionReferenceCodec } from "@xmtp/content-type-transaction-reference";
import { WalletSendCallsCodec } from "@xmtp/content-type-wallet-send-calls";
import { Client } from "@xmtp/node-sdk";
import {
  createSigner,
  getDbPath,
  getEncryptionKeyFromHex,
} from "@/helpers/client";
import { ENCRYPTION_KEY, WALLET_KEY, XMTP_ENV } from "@/lib/config";

export const getXmtpClient = async () => {
  /* Create the signer using viem and parse the encryption key for the local db */
  const signer = createSigner(WALLET_KEY);
  const dbEncryptionKey = getEncryptionKeyFromHex(ENCRYPTION_KEY);

  /* Initialize the xmtp client */
  return await Client.create(signer, {
    dbEncryptionKey,
    env: XMTP_ENV,
    codecs: [new WalletSendCallsCodec(), new TransactionReferenceCodec()],
    dbPath: getDbPath("xmtp"),
  });
};
