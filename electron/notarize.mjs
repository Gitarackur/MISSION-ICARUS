import { existsSync } from "node:fs";
import { rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { execFile } from "node:child_process";

const execFileAsync = promisify(execFile);

const hasApiKeyCredentials = () =>
  Boolean(
    process.env.APPLE_API_KEY_PATH &&
      process.env.APPLE_API_KEY_ID &&
      process.env.APPLE_API_ISSUER
  );

const hasAppleIdCredentials = () =>
  Boolean(
    process.env.APPLE_ID &&
      process.env.APPLE_APP_SPECIFIC_PASSWORD &&
      process.env.APPLE_TEAM_ID
  );

export default async function notarizeApp(context) {
  if (process.platform !== "darwin") {
    return;
  }

  if (!hasApiKeyCredentials() && !hasAppleIdCredentials()) {
    console.log("[notarize] Apple credentials not configured. Skipping notarization.");
    return;
  }

  const productFilename = context.packager.appInfo.productFilename;
  const appPath = path.join(context.appOutDir, `${productFilename}.app`);

  if (!existsSync(appPath)) {
    console.log(`[notarize] App not found at ${appPath}. Skipping notarization.`);
    return;
  }

  const archivePath = path.join(
    os.tmpdir(),
    `${productFilename}-${Date.now()}.zip`
  );

  console.log(`[notarize] Preparing ${appPath} for notarization.`);

  try {
    await execFileAsync("ditto", [
      "-c",
      "-k",
      "--sequesterRsrc",
      "--keepParent",
      appPath,
      archivePath,
    ]);

    const baseArgs = ["notarytool", "submit", archivePath, "--wait"];
    const authArgs = hasApiKeyCredentials()
      ? [
          "--key",
          process.env.APPLE_API_KEY_PATH,
          "--key-id",
          process.env.APPLE_API_KEY_ID,
          "--issuer",
          process.env.APPLE_API_ISSUER,
        ]
      : [
          "--apple-id",
          process.env.APPLE_ID,
          "--password",
          process.env.APPLE_APP_SPECIFIC_PASSWORD,
          "--team-id",
          process.env.APPLE_TEAM_ID,
        ];

    await execFileAsync("xcrun", [...baseArgs, ...authArgs]);
    await execFileAsync("xcrun", ["stapler", "staple", appPath]);

    console.log(`[notarize] Notarization complete for ${appPath}.`);
  } finally {
    await rm(archivePath, { force: true });
  }
}
