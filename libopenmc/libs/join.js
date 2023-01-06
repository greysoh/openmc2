export async function joinPath(...args) {
  let argv = [];

  for await (let arg of args) {
    if (arg == "..") {
      delete argv[argv.length - 1];
    } else if (arg.endsWith("\\") || arg.endsWith("/")) {
      argv.push(arg.slice(0, -1));
    } else {
      argv.push(arg);
    }
  }

  if (Deno.build.os == "windows") return argv.join("\\");
  return argv.join("/");
}
