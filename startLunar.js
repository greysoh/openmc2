import dir from "https://deno.land/x/dir/mod.ts";
import { joinPath } from "./libs/join.js";
import { existsSync } from "https://deno.land/std@0.152.0/fs/mod.ts";

async function findJRE(lunarPath) {
  const lunarDir = await joinPath(lunarPath, "jre");
  for await (const dirEntry of Deno.readDir(lunarDir)) {
    if (!dirEntry.isDirectory) continue;
    const dir = await joinPath(lunarDir, dirEntry.name);

    for await (const zulu of Deno.readDir(dir)) {
      if (!zulu.isDirectory) continue;
      const zuluDir = await joinPath(dir, zulu.name);

      return await joinPath(
        zuluDir,
        "bin",
        Deno.build.os === "windows" ? "java.exe" : "java"
      );
    }
  }
}

async function findCopyFiles(version, lunarPath, isIchor) {
  const data = [];

  const multiverRoot = await joinPath(lunarPath, "offline", "multiver");

  for await (const multiverData of Deno.readDir(multiverRoot)) {
    if (multiverData.isDirectory) continue;

    if (
      (multiverData.name.startsWith("lunar") ||
        multiverData.name.startsWith("lunar-") ||
        multiverData.name.startsWith("common-") ||
        multiverData.name.startsWith("genesis")) &&
      multiverData.name.endsWith(".jar")
    ) {
      data.push(await joinPath(multiverRoot, multiverData.name));
    } else if (
      multiverData.name.toLowerCase().startsWith("optifine") &&
      multiverData.name.endsWith(".jar")
    ) {
      const verData = multiverData.name.startsWith("OptiFine")
        ? multiverData.name.split("v")[1].split(".")[0].replaceAll("_", ".")
        : version;

      if (version.startsWith(verData)) {
        data.push(await joinPath(multiverRoot, multiverData.name));
      }
    } else if (
      multiverData.name.startsWith("v") &&
      multiverData.name.endsWith(".jar")
    ) {
      const verData = multiverData.name
        .split("v")[1]
        .split("-")[0]
        .replaceAll("_", ".");

      if (version.startsWith(verData)) {
        data.push(await joinPath(multiverRoot, multiverData.name));
      }
    }
  }

  return data.join(isIchor ? "," : ";");
}

/**
 * Gets the command to load Lunar Client.
 * @param {float} version Minecraft version to use
 * @param {boolean} enableUnsupportedModifications Allows injection for stuff like solar tweaks, etc.
 * @param {object} dir Directories to use ({root: "", lunar: ""})
 * @param {object} args Command line arguments to use ({jvm: "", lunar: ""}
 * @returns {string} Command to execute to run Lunar Client
 */
export async function loadLunarCommand(
  version,
  enableUnsupportedModifications,
  dir,
  args
) {
  const lunarDir = dir.lunar;
  const rootDir = dir.root;

  const jreArgs = args.jvm;
  const lunarArgs = args.lunar;

  console.log(
    "version: %s, rootDir: %s, lunarDir: %s",
    version,
    rootDir,
    lunarDir
  );

  let cmd = "";
  const jre = await findJRE(lunarDir);

  const nativesDir = await joinPath(lunarDir, "offline", "multiver", "natives");

  cmd += `${jre} --add-modules jdk.naming.dns --add-exports jdk.naming.dns/com.sun.jndi.dns=java.naming`;
  cmd += ` -Djna.boot.library.path=${nativesDir}`;
  cmd += ` -Dlog4j2.formatMsgNoLookups=true`; // Disable lookups for log4j so that computer no go boom
  cmd += ` --add-opens java.base/java.io=ALL-UNNAMED${
    jreArgs ? " " + jreArgs : ""
  }`;
  cmd += ` -Djava.library.path=${nativesDir}`;

  if (enableUnsupportedModifications) {
    const solarConf = await joinPath(lunarDir, "solartweaks", "config.json");
    const solarJar = await joinPath(lunarDir, "solartweaks", "solar-patcher.jar");

    if (existsSync(solarConf) && existsSync(solarJar)) {
       cmd += ` -javaagent:${solarJar}=${solarConf}`
    }
  }
  cmd += ` -XX:+DisableAttachMechanism -cp`;

  cmd += ` ${await findCopyFiles(
    version,
    lunarDir,
    false
  )} com.moonsworth.lunar.genesis.Genesis`;
  cmd += ` --version ${version}`;
  cmd += ` --accessToken 0 --assetIndex ${version} --userProperties {} --gameDir`;
  cmd += ` ${
    rootDir
      ? rootDir
      : Deno.build.os == "windows"
      ? await joinPath(dir("home"), "AppData", "Roaming", ".minecraft")
      : await joinPath(dir("home"), ".minecraft")
  }`;
  cmd += ` --texturesDir ${await joinPath(lunarDir, "textures")}`;
  cmd += ` --ichorClassPath ${await findCopyFiles(version, lunarDir, true)}`;
  cmd += ` --ichorExternalFiles OptiFine-${version.split(".")[0]}.${
    version.split(".")[1]
  }.jar`;
  cmd += ` --workingDirectory . --classpathDir ${nativesDir}`;
  cmd += lunarArgs ? " " + lunarArgs : "";

  return cmd;
}
