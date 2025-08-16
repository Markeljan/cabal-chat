import { Client, type XmtpEnv } from "@xmtp/node-sdk";
import { createSigner, getEncryptionKeyFromHex } from "@/helpers/client.ts";
import { ENCRYPTION_KEY, WALLET_KEY, XMTP_ENV } from "@/lib/config";

/**
 * Standalone Installation Cleaner
 *
 * This script cleans ALL XMTP installations to start completely fresh.
 * Use this when you get "too many installations" errors that prevent server startup.
 */

async function cleanAllInstallations() {
  try {
    console.log(
      "🧹 Starting complete installation cleanup (removing ALL installations)...",
    );

    // Create signer
    const signer = createSigner(WALLET_KEY);
    const identifier = await signer.getIdentifier();
    console.log(`📧 Wallet address: ${identifier.identifier}`);

    // We need to get the InboxID first - create a temporary client to get it
    console.log("🔍 Getting InboxID...");

    let inboxId: string;
    try {
      // Try to create client to get InboxID (this might fail due to installations)
      const tempClient = await Client.create(signer, {
        dbEncryptionKey: getEncryptionKeyFromHex(ENCRYPTION_KEY),
        env: XMTP_ENV as XmtpEnv,
        dbPath: null,
      });

      inboxId = tempClient.inboxId;
      console.log(`📦 InboxID: ${inboxId}`);
    } catch (error) {
      // If client creation fails, extract InboxID from error message
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      console.log(`🔍 Error message: ${errorMessage}`);
      const inboxIdMatch = errorMessage.match(/InboxID ([a-f0-9]+)/);

      if (!inboxIdMatch) {
        console.log("❌ Could not find InboxID pattern in error message");
        console.log("   Looking for pattern: /InboxID ([a-f0-9]+)/");
        throw new Error("Could not extract InboxID from error message");
      }

      inboxId = inboxIdMatch[1];
      console.log(`📦 InboxID (from error): ${inboxId}`);
    }

    // Get current installations using static method
    console.log("📊 Getting current installations...");
    const inboxState = await Client.inboxStateFromInboxIds(
      [inboxId],
      XMTP_ENV as XmtpEnv,
    );
    const currentInstallations = inboxState[0].installations;

    console.log(`✓ Current installations: ${currentInstallations.length}`);

    // Check if cleanup is needed
    if (currentInstallations.length === 0) {
      console.log("✅ No installations found - already clean");
      return;
    }

    console.log(
      `⚠️  Will remove ALL ${currentInstallations.length} installations`,
    );

    // Get ALL installations to revoke
    const installationsToRevoke = currentInstallations.map(
      (installation) => installation.bytes,
    );

    const installationsToRevokeInfo = currentInstallations.map(
      (installation, index) => ({
        index: index + 1,
        id: installation.id,
        clientTimestampNs: installation.clientTimestampNs,
      }),
    );

    console.log("📋 ALL installations to revoke:");
    installationsToRevokeInfo.forEach((inst) => {
      console.log(
        `  ${inst.index}. ${inst.id} (${inst.clientTimestampNs || "unknown ts"})`,
      );
    });

    console.log(
      `\n🔄 Revoking ALL ${currentInstallations.length} installations...`,
    );

    // Revoke ALL installations
    await Client.revokeInstallations(
      signer,
      inboxId,
      installationsToRevoke,
      XMTP_ENV as XmtpEnv,
    );

    console.log(
      `✅ Successfully revoked ALL ${currentInstallations.length} installations`,
    );

    // Verify final state
    const finalInboxState = await Client.inboxStateFromInboxIds(
      [inboxId],
      XMTP_ENV as XmtpEnv,
    );
    const finalInstallations = finalInboxState[0].installations;

    console.log(`\n📊 Final state:`);
    console.log(`  Installations: ${finalInstallations.length}`);
    console.log(`  Status: ✅ Completely clean - ready for fresh start`);

    console.log(
      "\n🎉 Complete cleanup finished! You can now start the server:",
    );
    console.log("   yarn start");
    console.log(
      "\nNote: The server will create a new installation automatically when it starts.",
    );
  } catch (error) {
    console.error(
      "❌ Cleanup failed:",
      error instanceof Error ? error.message : String(error),
    );
    console.error("\nTroubleshooting:");
    console.error(
      "1. Check your .env file has correct WALLET_KEY, ENCRYPTION_KEY, and XMTP_ENV",
    );
    console.error("2. Make sure you have network connectivity");
    console.error("3. Try running the script again");
    process.exit(1);
  }
}

// Run the cleanup
cleanAllInstallations().catch((error) => {
  console.error("💥 Unexpected error:", error);
  process.exit(1);
});
