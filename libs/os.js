export function runShell(cmd) {
  return new Promise(async (resolve, reject) => {
    let p = {};

    while (true) {
      try {
        p = Deno.run({
          cmd: cmd.split(" "),
        });

        break;
      } catch (e) {
        if (e.toString().startsWith("NotFound")) {
          return reject(e);
        }
      }
    }

    const code = await p.status();
    resolve(code);
  });
}