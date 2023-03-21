import TokenStream from '../../jass2/tokenstream';
import { IniSection, IniFile } from '../../ini/file';

/**
 * A standard object mapping strings to strings.
 */
export type StringObject = {[key: string]: string };


export type FunctionSignature = { args: string[], scriptName: string | null, returnType: string | null };

/**
 * A standard object mapping strings to function signatures and an optional Jass name.
 */
export type FunctionObject = {[key: string]: FunctionSignature };

/**
 * Trigger data needed to load a WTG file.
 */
export class TriggerData {
  types: StringObject = {};
  functions: FunctionObject[] = [{}, {}, {}, {}];
  presets: StringObject = {};
  externalTypes: StringObject = {};
  externalFunctions: FunctionObject[] = [{}, {}, {}, {}];
  externalPresets: StringObject = {};

  addTriggerData(buffer: string, isExternal: boolean): void {
    let types = this.types;
    let functions = this.functions;
    let presets = this.presets;

    if (isExternal) {
      types = this.externalTypes;
      functions = this.externalFunctions;
      presets = this.externalPresets;
    }

    const triggerData = new IniFile();

    triggerData.load(buffer);

    let section = triggerData.getSection('TriggerTypes');
    if (section) {
      this.addTriggerTypes(types, section);
    }

    section = triggerData.getSection('TriggerEvents');
    if (section) {
      this.addTriggerDataFunctions(functions[0], section, 1);
    }

    section = triggerData.getSection('TriggerConditions');
    if (section) {
      this.addTriggerDataFunctions(functions[1], section, 1);
    }

    section = triggerData.getSection('TriggerActions');
    if (section) {
      this.addTriggerDataFunctions(functions[2], section, 1);
    }

    section = triggerData.getSection('TriggerCalls');
    if (section) {
      this.addTriggerDataFunctions(functions[3], section, 3);
    }

    section = triggerData.getSection('TriggerParams');
    if (section) {
      this.addTriggerDataPresets(presets, section);
    }
  }

  addTriggerTypes(types: StringObject, section: IniSection): void {
    for (const [key, value] of section) {
      // We know the values are going to be strings.
      const tokens = value.split(',');

      types[key.toLowerCase()] = tokens[4] || '';
    }
  }

  addTriggerDataFunctions(functions: FunctionObject, section: IniSection, skipped: number): void {
    for (const [key, value] of section) {
      // We don't care about metadata lines.
      if (key[0] !== '_') {
        // We know the values are going to be strings.
        const tokens = value.split(',');
        const args: string[] = [];

        // Can be used by actions to make aliases.
        const scriptName = <string>section.get(`_${key}_scriptname`) || null;

        let returnType: string = '';

        // TriggerCalls have a return type.
        if (skipped === 3) {
          returnType = tokens[2];
        }

        for (let i = skipped, l = tokens.length; i < l; i++) {
          const token = tokens[i];

          // We don't care about constants.
          if (Number.isNaN(parseFloat(token)) && token !== 'nothing' && token !== '') {
            args.push(token);
          }
        }

        functions[key.toLowerCase()] = { args, scriptName, returnType };
      }
    }
  }

  addTriggerDataPresets(presets: StringObject, section: IniSection): void {
    for (const [key, value] of section) {
      // We know the values are going to be strings.
      const tokens = value.split(',');

      // Note that the operators are enclosed by "" for some reason.
      // Note that string literals are enclosed by backticks.
      presets[key.toLowerCase()] = tokens[2].replace(/"/g, '').replace(/`/g, '"');
    }
  }

  addJassFunctions(jass: string): void {
    const stream = new TokenStream(jass);
    let token;

    while ((token = stream.read()) !== undefined) {
      if (token === 'native' || token === 'function') {
        const scriptName = stream.read();

        if (scriptName) {
          token = stream.read();

          if (token === 'takes') {
            const args: any[] = [];
            const token = stream.readSafe(); // nothing or type

            if (token !== 'nothing') {
              args.push(token);
              stream.readSafe();

              while (stream.read() === ',') {
                args.push(stream.readSafe());
                stream.readSafe();
              }
            } else {
              stream.read(); // returns
            }

            let returnType: string | null = stream.readSafe();

            if (returnType === 'nothing') {
              returnType = null;
            }

            const name = scriptName.toLowerCase();
            const signature = { args, scriptName, returnType };

            // There is no way to know if this signature could be used as a TriggerAction or TriggerCall.
            // So try to always add to TriggerAction...
            this.externalFunctions[2][name] = signature;

            // ...and if there is a return type, add also to TriggerCall.
            if (returnType !== 'nothing') {
              this.externalFunctions[3][name] = signature;
            }
          }
        }
      }
    }
  }

  /**
   * Given a type, return its base type.
   *
   * Returns the given type if its not a child type.
   */
  getBaseType(type: string): string {
    type = type.toLowerCase();

    let base = this.types[type];

    if (base === undefined) {
      base = this.externalTypes[type];
    }

    // Same as !base, but be explicit to be clearer.
    if (base === '' || base === undefined) {
      return type;
    }

    return base;
  }

  isBaseFunction(type: number, name: string): boolean {
    name = name.toLowerCase();

    if (this.functions[type][name]) {
      return true;
    }

    return false;
  }

  /**
   * Gets the signature of the given function.
   */
  getFunction(type: number, name: string): FunctionSignature {
    name = name.toLowerCase();

    let args = this.functions[type][name];

    if (!args) {
      args = this.externalFunctions[type][name];
    }

    return args;
  }

  /**
   * Get the type of a function given its name.
   * Returns -1 if the function isn't recognized.
   */
  getFunctionType(name: string): number {
    name = name.toLowerCase();

    const functions = this.functions;

    for (let i = 0; i < 4; i++) {
      if (functions[i][name]) {
        return i;
      }
    }

    return -1;
  }

  /**
   * Gets a preset value.
   */
  getPreset(name: string): string {
    name = name.toLowerCase();

    let preset = this.presets[name];

    if (preset === undefined) {
      preset = this.externalPresets[name];
    }

    return preset;
  }

  /**
   * Is the given preset a custom or standard one?
   */
  isCustomPreset(name: string): boolean {
    name = name.toLowerCase();

    if (this.presets[name] !== undefined) {
      return false;
    }

    if (this.externalPresets[name] !== undefined) {
      return true;
    }

    throw new Error(`Failed to find a preset: ${name}`);
  }
}
