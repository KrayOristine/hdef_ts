export class Logger
{
    public static Debug(className: string, message: string)
    {
        DisplayTextToPlayer(GetLocalPlayer(), 0, 0.35, `[|c000000ffDEBUG|r - ${className}]: ${message}`);
    }

    public static Verbose(className: string, message: string) {
        DisplayTextToPlayer(GetLocalPlayer(), 0, 0.35, `[|c00ffff00VERBOSE|r - ${className}]: ${message}`);
    }

    public static Error(className: string, message: string)
    {
        DisplayTextToPlayer(GetLocalPlayer(), 0, 0.35, `[|c00ff0000ERROR|r - ${className}]: ${message}`);
    }

    public static Warning(className: string, message: string)
    {
        DisplayTextToPlayer(GetLocalPlayer(), 0, 0.35, `[|c00ffff00WARN|r - ${className}]: ${message}`);
    }

    public static Log(className: string, message: string)
    {
        DisplayTextToPlayer(GetLocalPlayer(), 0, 0.35, `[${className}]: ${message}`);
    }
}