import { recursiveReaddir } from "https://deno.land/x/recursive_readdir/mod.ts";

async function findCopyFiles(path) {
  const dataOld = await recursiveReaddir(path);
  const data = dataOld.map((i) => i.replaceAll("\\", "/"));

  return data.join(";");
}

/**
 * Gets the command to load Minecraft.
 * @returns {string} Command to execute to run Minecraft
 */
export async function loadMinecraftCMD(
  eagleDirectory,
  minecraftJar,
  minecraftJarVersion,
  className,
  username,
  userToken
) {
  console.warn("echo WARNING: This build of OpenMC2 only supports the directories created by eagle!");

  let cmd = "java";
  cmd += ` -Xms512m -Xmx1g -Djava.library.path=${eagleDirectory}/natives/`;
  cmd += ` -cp "${eagleDirectory.replace("./", "") + "/" + minecraftJar};${await findCopyFiles(eagleDirectory + "/libraries")}"`;
  cmd += ` ${className}`; 
  cmd += ` --version ${minecraftJarVersion} --userProperties {} --accessToken ${userToken ? userToken : username}`
  cmd += ` ${username} ${userToken}`;

  return cmd;
}
