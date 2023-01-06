// TODO: Remove deprecated garbage?
import { exists } from "https://deno.land/std@0.171.0/fs/exists.ts";

import axiod from "https://deno.land/x/axiod@0.26.2/mod.ts";

import { getRandomInt } from "./libs/rand.js";
import { runShell } from "./libs/os.js";

import { loadMinecraftCMD } from "./libopenmc/mod.js";

const randWelcomeMessages = ["let me guess, breaking the law??", "what it pineapple+pen?", "Eagle wuz here", "your rap name is lil + the last reason you were in the hospital", "Me when the Judge sentences me to show results", "What if we sat on the Jouch?? :flushed:", "$jndi:lfap('https://nsa.gov/hax/ip')", "Windows 12 ISO LEAK (NOT CLICKBAIT)"]

console.log("OpenMC2 is loading...");
console.log("  // " + randWelcomeMessages[getRandomInt(0, randWelcomeMessages.length-1)])

console.log("INFO: Detecting Minecraft...");

if (!Deno.args[0]) {
  console.error("OpenMC2: No arguments specified! (take it to twitter?)");
  Deno.exit(1);
} else if (!await exists(Deno.args[0])) {
  console.error("OpenMC2: The directory specified doesn't exist. (take it to twitter, fr)");
  Deno.exit(1);
}

let mcVer = null;

for await (const i of Deno.readDir(Deno.args[0])) {
  if (i.isFile && i.name.endsWith(".jar")) mcVer = i.name.replace(".jar", "");
}

if (!mcVer) {
  console.error("OpenMC2: Failed to detect a valid Minecraft version!");
  Deno.exit(1);
}

console.log("INFO: Fetching Minecraft version list...");

const launcherManifest = await axiod.get(
  "https://launchermeta.mojang.com/mc/game/version_manifest.json"
);

const verData = launcherManifest.data.versions.find((i) => i.id == mcVer);

if (!verData) {
  console.error("OpenMC2: Failed to detect version URL!");
  Deno.exit(1);
}

const verExtData = await axiod.get(verData.url);
const className = verExtData.data.mainClass;

console.log("INFO: Loading loader command.");

const mineCMD = await loadMinecraftCMD(Deno.args[0].replaceAll("\\", "/"), mcVer + ".jar", mcVer, className, "jeb_", 0);
console.log("INFO: Starting Minecraft...");

// FIXME: Minecraft doesn't start unless started via cmd, fully.
const script = `@echo off\ncd "${Deno.args[0]}"\n${mineCMD}`;

await Deno.writeTextFile("tmp.bat", script);
await runShell("cmd.exe /c tmp.bat");
await Deno.remove("tmp.bat");
