import {execFile} from "child_process";
import {loadProjectConfig, logger} from "./utils";

function main() {
  const config = loadProjectConfig();
  const cwd = process.cwd();
  const file = `${cwd}/dist/${config.mapFolder}`;

  logger.info(`Launching map "${file.replace(/\\/g, "/")}"...`);
  execFile(config.gameExecutable, [...config.launchArgs, "-loadfile", file], (err: any) => {
    if (err && err.code === 'ENOENT') {
      logger.error(`No such file or directory "${config.gameExecutable}". Make sure gameExecutable is configured properly in config.json.`);
    }
  });
}

main();
