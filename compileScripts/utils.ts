import { execSync } from "child_process";
import { writeFileSync } from "fs";
import * as fs from "fs-extra";
import * as path from "path";
import { createLogger, format, transports } from "winston";
import * as ts from "typescript";
const { combine, timestamp, printf } = format;
const luamin = require('luamin');

interface IProjectConfig {
  compilerOptions: {
    baseUrl: string;
    outDir: string;
    scripts: {
      constantFolding: boolean;
      minify: boolean;
      optimize: boolean;
      encrypt: {
        enable: boolean;
        key: string;
        salt: string;
      };
    };
    protection: {
      removeEditorOnly: boolean;
      scrambleHeader: boolean;
      obfuscateScripts: boolean;
      obfuscateFileName: boolean;
      obfuscateObjectId: boolean;
      fakeScripts: boolean;
      scrambleFile: boolean;
      scrambleRepeat: number;
    };
  };
  game: {
    executable: string;
    args: string[];
  };
}

interface TSConfig {
  compilerOptions: CompilerOptions;
  include: string[];
  exclude: any[];
  tstl: Tstl;
}

interface Tstl {
  luaTarget: string;
  noHeader: boolean;
  luaLibImport: string;
  noImplicitSelf: boolean;
  luaBundle: string;
  luaBundleEntry: string;
  sourceMapTraceback: boolean;
  measurePerformance: boolean;
  tstlVerbose: boolean;
}

export interface CompilerOptions extends ts.CompilerOptions {
  plugins: Plugin[];
}

interface Plugin extends ts.PluginImport {
  transform: string;
  enable: boolean,
  cfPrecision: number;
  mapDir: string;
  entryFile: string;
  outputDir: string;
}

const cache = new Map<string, any>();

export function loadProjectConfig(): IProjectConfig {
  if (cache.has("projectConfig")) return cache.get("projectConfig");
  try {
    cache.set("projectConfig", JSON.parse(fs.readFileSync("config.json").toString()))

    return cache.get("projectConfig");
  } catch (e) {
    logger.error(e.toString());
    return {
      "compilerOptions":{
        "baseUrl": "",
        "outDir": "",

        "scripts":{
          "constantFolding": false,
          "minify": false,
          "optimize": false,
          "encrypt": {
            "enable": false,

            "key": "",
            "salt": ""
          }
        },

        "protection":{
          "removeEditorOnly": false,
          "scrambleHeader": false,
          "obfuscateScripts": false,
          "obfuscateFileName": false,
          "obfuscateObjectId": false,
          "fakeScripts": false,
          "scrambleFile": false,
          "scrambleRepeat": 1
        }
      },

      "game":{
        "executable": "",
        "args": [""]
      }
    };
  }
}

export function loadTSConfig(): TSConfig {
  if (cache.has("tsConfig")) return cache.get("tsConfig");
  try {
    cache.set("tsConfig", JSON.parse(fs.readFileSync("tsconfig.json").toString()));

    return cache.get("tsConfig");
  } catch (e){
    logger.error(e.toString());
    //@ts-expect-error
    return {};
  }
}

/**
 * Convert a Buffer to ArrayBuffer
 * @param buf
 */
export function toArrayBuffer(b: Buffer): ArrayBuffer {
  var ab = new ArrayBuffer(b.length);
  var view = new Uint8Array(ab);
  for (var i = 0; i < b.length; ++i) {
    view[i] = b[i];
  }
  return ab;
}

/**
 * Convert a ArrayBuffer to Buffer
 * @param ab
 */
export function toBuffer(ab: ArrayBuffer) {
  var buf = Buffer.alloc(ab.byteLength);
  var view = new Uint8Array(ab);
  for (var i = 0; i < buf.length; ++i) {
    buf[i] = view[i];
  }
  return buf;
}

/**
 * Recursively retrieve a list of files in a directory.
 * @param dir The path of the directory
 */
export function getFilesInDirectory(dir: string) {
  const files: string[] = [];
  fs.readdirSync(dir).forEach(file => {
    let fullPath = path.join(dir, file);
    if (fs.lstatSync(fullPath).isDirectory()) {
      const d = getFilesInDirectory(fullPath);
      for (const n of d) {
        files.push(n);
      }
    } else {
      files.push(fullPath);
    }
  });
  return files;
};

/**
 * Replaces all instances of the include directive with the contents of the specified file.
 * @param contents war3map.lua
 */
export function processScriptIncludes(contents: string) {
  const regex = /include\(([^)]+)\)/gm;
  let matches;
  while ((matches = regex.exec(contents)) !== null) {
    const filename = matches[1].replace(/"/g, "").replace(/'/g, "");
    const fileContents = fs.readFileSync(filename);
    contents = contents.substring(0, regex.lastIndex - matches[0].length) + "\n" + fileContents + "\n" + contents.substring(regex.lastIndex);
  }
  return contents;
}

function updateTSConfig(mapFolder: string) {
  const tsconfig = loadTSConfig();
  const plugin = tsconfig.compilerOptions.plugins;

  plugin[1].enable = loadProjectConfig().compilerOptions.scripts.constantFolding;
  plugin[1].cfPrecision = 0;
  plugin[0].mapDir = path.resolve('maps', mapFolder).replace(/\\/g, '/');
  plugin[0].entryFile = path.resolve(tsconfig.tstl.luaBundleEntry).replace(/\\/g, '/');
  plugin[0].outputDir = path.resolve('dist', mapFolder).replace(/\\/g, '/');

  writeFileSync('tsconfig.json', JSON.stringify(tsconfig, undefined, 2));
}

function getMapName(str: string){
  let split = str.split('/')

  return split[split.length-1];
}

/**
 *
 */
export function compileMap(config: IProjectConfig) {
  if (!config.compilerOptions.baseUrl || config.compilerOptions.baseUrl === "") {
    logger.error(`[config.json]: baseUrl is empty!`);
    return false;
  }

  const tsLua = `${config.compilerOptions.outDir}/dist/tstl_output.lua`;

  if (fs.existsSync(tsLua)) {
    fs.unlinkSync(tsLua);
  }

  logger.info(`Building "${config.compilerOptions.baseUrl}"...`);
  fs.copySync(`${config.compilerOptions.baseUrl}`, `${config.compilerOptions.outDir}/dist/${getMapName(config.compilerOptions.baseUrl)}`);

  logger.info("Modifying tsconfig.json to work with war3-transformer...");
  updateTSConfig(config.compilerOptions.baseUrl);

  logger.info("Transpiling TypeScript to Lua...");
  execSync('tstl -p tsconfig.json', { stdio: 'inherit' });

  if (!fs.existsSync(tsLua)) {
    logger.error(`Could not find "${tsLua}"`);
    return false;
  }

  // Merge the TSTL output with war3map.lua
  const mapLua = `./${config.compilerOptions.baseUrl}/war3map.lua`;

  if (!fs.existsSync(mapLua)) {
    logger.error(`Could not find "${mapLua}"`);
    return false;
  }

  try {
    let contents = fs.readFileSync(mapLua).toString() + fs.readFileSync(tsLua).toString();
    contents = processScriptIncludes(contents);

    if (config.compilerOptions.scripts.minify) {
      logger.info(`Minifying script...`);
      contents = luamin.minify(contents.toString());
    }
    //contents = luamin.minify(contents);
    fs.writeFileSync(mapLua, contents);
  } catch (err) {
    logger.error(err.toString());
    return false;
  }

  return true;
}

/**
 * Formatter for log messages.
 */
const loggerFormatFunc = printf(({ level, message, timestamp }) => {
  return `[${timestamp.replace("T", " ").split(".")[0]}] ${level}: ${message}`;
});

/**
 * The logger object.
 */
export const logger = createLogger({
  transports: [
    new transports.Console({
      format: combine(
        format.colorize(),
        timestamp(),
        loggerFormatFunc
      ),
    }),
    new transports.File({
      filename: "project.log",
      format: combine(
        timestamp(),
        loggerFormatFunc
      ),
    }),
  ]
});
