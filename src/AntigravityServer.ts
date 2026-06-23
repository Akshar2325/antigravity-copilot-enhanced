import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as net from 'net';
import { spawn, ChildProcess, execFile, execSync } from 'child_process';
import { installCLIProxyAPI } from './CLIProxyAPIDownloader';

export interface ServerConfig {
    enabled: boolean;
    autoStart: boolean;
    executablePath: string;
    port: number;
    host: string;
}

export interface ServerStatus {
    running: boolean;
    config: ServerConfig;
    pid?: number;
}

export class AntigravityServer implements vscode.Disposable {
    private process: ChildProcess | undefined;
    private config: ServerConfig;
    private actualPort: number | undefined; // The port the server actually bound to
    private disposed = false;
    private configChangeDisposable: vscode.Disposable;

    private readonly _onDidChangeStatus = new vscode.EventEmitter<void>();
    public readonly onDidChangeStatus = this._onDidChangeStatus.event;

    constructor(
        private readonly output: vscode.OutputChannel,
        private readonly context: vscode.ExtensionContext
    ) {
        this.config = this.getServerConfig();

        // Listen for config changes
        this.configChangeDisposable = vscode.workspace.onDidChangeConfiguration((e: vscode.ConfigurationChangeEvent) => {
            if (e.affectsConfiguration('antigravityCopilot')) {
                const newConfig = this.getServerConfig();
                const needsRestart = this.process && (
                    newConfig.port !== this.config.port ||
                    newConfig.host !== this.config.host ||
                    newConfig.executablePath !== this.config.executablePath
                );
                this.config = newConfig;
                if (needsRestart) {
                    void this.restart();
                }
            }
        });
    }

    private getServerConfig(): ServerConfig {
        const config = vscode.workspace.getConfiguration('antigravityCopilot.server');
        const storedPath = config.get<string>('executablePath', '');
        return {
            enabled: config.get<boolean>('enabled', false),
            autoStart: config.get<boolean>('autoStart', false),
            executablePath: this.resolveExecutablePath(storedPath),
            port: config.get<number>('port', 8317),
            host: config.get<string>('host', '127.0.0.1')
        };
    }

    private getDefaultExecutablePath(): string {
        const execName = process.platform === 'win32' ? 'cli-proxy-api.exe' : 'cli-proxy-api';
        return path.join(os.homedir(), 'CLIProxyAPI', execName);
    }

    /**
     * Resolve the executable path to use. If the stored path is empty, a
     * Windows-style path on a non-Windows machine, or a non-Windows binary on
     * Windows, fall back to the platform default so synced settings never break
     * another machine.
     */
    private resolveExecutablePath(storedPath: string): string {
        if (!storedPath) {
            return this.getDefaultExecutablePath();
        }
        const isWindows = process.platform === 'win32';
        const storedIsWindowsPath = storedPath.endsWith('.exe') || /^[A-Za-z]:[/\\]/.test(storedPath);
        if (isWindows !== storedIsWindowsPath) {
            this.logInfo(`Stored executablePath "${storedPath}" is for a different platform — using platform default`);
            return this.getDefaultExecutablePath();
        }
        return storedPath;
    }

    private getConfigPath(): string {
        return path.join(path.dirname(this.config.executablePath), 'config.yaml');
    }

    private ensureConfigExists(portOverride?: number): void {
        const configPath = this.getConfigPath();
        const portToUse = portOverride ?? this.config.port;

        // If config exists, we may need to update the port
        if (fs.existsSync(configPath)) {
            this.logInfo(`Config file found at: ${configPath}`);

            // Always ensure config file has the correct port we intend to use
            try {
                let content = fs.readFileSync(configPath, 'utf8');
                const portMatch = content.match(/^port:\s*(\d+)/m);
                const currentFilePort = portMatch ? parseInt(portMatch[1], 10) : undefined;

                if (currentFilePort !== portToUse) {
                    // Update port in existing config
                    content = content.replace(/^port:\s*\d+/m, `port: ${portToUse}`);
                    fs.writeFileSync(configPath, content, 'utf8');
                    this.logInfo(`Updated config file port from ${currentFilePort} to ${portToUse}`);
                }
            } catch (error) {
                this.logError('Failed to update config file port', error);
            }
            return;
        }

        this.logInfo(`Creating default config file at: ${configPath}`);

        const userProfile = os.homedir();
        const authDir = path.join(userProfile, '.cli-proxy-api').replace(/\\/g, '\\\\');

        const defaultConfig = `# CLIProxyAPI Configuration
# Auto-generated by Antigravity for Copilot extension

port: ${portToUse}
host: "${this.config.host}"

# Auth directory for storing credentials
auth-dir: "${authDir}"

# Enable Antigravity provider (Claude & Gemini via Google OAuth)
providers:
  antigravity:
    enabled: true
`;

        try {
            fs.writeFileSync(configPath, defaultConfig, 'utf8');
            this.logInfo('Default config file created successfully');
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            this.logError('Failed to create config file', error);
            throw new Error(`Failed to create config file: ${message}`);
        }
    }

    public getStatus(): ServerStatus {
        return {
            running: !!this.process,
            config: {
                ...this.config,
                port: this.actualPort ?? this.config.port // Return actual bound port
            },
            pid: this.process?.pid
        };
    }

    private logInfo(message: string) {
        this.output.appendLine(`[${new Date().toISOString()}] INFO ${message}`);
    }

    private logError(message: string, error?: unknown) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        this.output.appendLine(`[${new Date().toISOString()}] ERROR ${message}: ${errorMsg}`);
    }

    public async start(): Promise<void> {
        if (this.disposed) {
            return;
        }

        if (this.process) {
            this.logInfo('Server is already running');
            return;
        }

        // Auto-download CLIProxyAPI silently if the binary is missing.
        if (!fs.existsSync(this.config.executablePath)) {
            this.logInfo(`CLIProxyAPI not found at "${this.config.executablePath}" — auto-downloading...`);
            const installed = await this.autoInstall();
            if (!installed) {
                return; // error already shown inside autoInstall()
            }
        }

        // Find an available port (try configured port first, then increment)
        let portToUse: number;
        try {
            portToUse = await this.findAvailablePort(this.config.host, this.config.port);
            if (portToUse !== this.config.port) {
                this.logInfo(`Configured port ${this.config.port} is in use, using port ${portToUse} instead`);
            }
        } catch (error) {
            const message = error instanceof Error ? error.message : String(error);
            throw new Error(`Failed to find available port: ${message}`);
        }

        // Ensure config.yaml exists with the correct port
        this.ensureConfigExists(portToUse);
        this.actualPort = portToUse;

        this.logInfo(`Starting CLIProxyAPI from: ${this.config.executablePath}`);

        // Spawn the process
        this.process = spawn(this.config.executablePath, [], {
            cwd: path.dirname(this.config.executablePath),
            stdio: ['ignore', 'pipe', 'pipe'],
            windowsHide: true
        });

        // Handle stdout
        this.process.stdout?.on('data', (data: Buffer) => {
            const lines = data.toString().trim().split('\n');
            for (const line of lines) {
                this.output.appendLine(`[SERVER] ${line}`);
            }
        });

        // Handle stderr
        this.process.stderr?.on('data', (data: Buffer) => {
            const lines = data.toString().trim().split('\n');
            for (const line of lines) {
                this.output.appendLine(`[SERVER ERROR] ${line}`);
            }
        });

        // Handle process exit
        this.process.on('exit', (code: number | null, signal: string | null) => {
            this.logInfo(`Server process exited with code ${code}, signal ${signal}`);
            this.process = undefined;
            this.actualPort = undefined;
            this._onDidChangeStatus.fire();
        });

        // Handle process error
        this.process.on('error', (error: Error) => {
            this.logError('Failed to start server process', error);
            this.process = undefined;
            this._onDidChangeStatus.fire();
        });

        // Wait for the server to be ready by checking if the port is open
        const startTime = Date.now();
        const timeout = 10000; // 10 seconds timeout
        let serverReady = false;
        let lastError: Error | undefined;

        while (Date.now() - startTime < timeout) {
            // Check if process has exited
            if (!this.process || this.process.exitCode !== null) {
                throw new Error('Server process exited unexpectedly during startup');
            }

            // Try to connect to the server port (use actualPort, not config port)
            try {
                await this.checkPortOpen(this.config.host, portToUse);
                serverReady = true;
                break;
            } catch (error) {
                lastError = error instanceof Error ? error : new Error(String(error));
                // Wait a bit before retrying
                await new Promise(resolve => setTimeout(resolve, 500));
            }
        }

        if (!serverReady) {
            // Server didn't become ready in time
            if (this.process) {
                const proc = this.process;
                this.process = undefined;
                this.actualPort = undefined;
                await this.killProcess(proc);
            }
            const last = lastError ? ` Last error: ${lastError.message}` : '';
            throw new Error(
                `Server failed to start: port ${portToUse} is not responding after ${timeout / 1000}s.${last}`
            );
        }

        this.logInfo(`CLIProxyAPI started successfully (PID: ${this.process.pid}, Port: ${portToUse})`);
        await this.updateServerConfig({ enabled: true });
        this._onDidChangeStatus.fire();
    }

    private checkPortOpen(host: string, port: number): Promise<void> {
        return new Promise((resolve, reject) => {
            const socket = new net.Socket();
            const timeout = 1000;

            socket.setTimeout(timeout);

            socket.on('connect', () => {
                socket.destroy();
                resolve();
            });

            socket.on('timeout', () => {
                socket.destroy();
                reject(new Error('Connection timeout'));
            });

            socket.on('error', (error: Error) => {
                socket.destroy();
                reject(error);
            });

            socket.connect(port, host);
        });
    }

    /**
     * Check if a port is available (not in use).
     * Returns true if available, false if in use.
     */
    private isPortAvailable(host: string, port: number): Promise<boolean> {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', () => {
                resolve(false);
            });
            server.once('listening', () => {
                server.close(() => resolve(true));
            });
            server.listen(port, host);
        });
    }

    /**
     * Find an available port starting from the configured port.
     * Tries up to maxAttempts ports.
     */
    private async findAvailablePort(host: string, startPort: number, maxAttempts: number = 10): Promise<number> {
        for (let i = 0; i < maxAttempts; i++) {
            const port = startPort + i;
            const available = await this.isPortAvailable(host, port);
            if (available) {
                return port;
            }
            this.logInfo(`Port ${port} is in use, trying next...`);
        }
        throw new Error(`No available port found in range ${startPort}-${startPort + maxAttempts - 1}`);
    }

    public async stop(): Promise<void> {
        if (!this.process) {
            this.logInfo('Server is not running');
            return;
        }

        this.logInfo('Stopping CLIProxyAPI...');

        const process = this.process;
        this.process = undefined;

        try {
            await this.killProcess(process);
        } catch (error) {
            this.logError('Error stopping server', error);
        }

        this.logInfo('CLIProxyAPI stopped');
        await this.updateServerConfig({ enabled: false });
        this._onDidChangeStatus.fire();
    }

    public async restart(): Promise<void> {
        if (this.disposed) {
            return;
        }
        this.logInfo('Restarting CLIProxyAPI...');
        await this.stop();
        await new Promise(resolve => setTimeout(resolve, 1000));
        await this.start();
    }

    public async login(): Promise<void> {
        // Auto-download CLIProxyAPI silently if the binary is missing.
        if (!fs.existsSync(this.config.executablePath)) {
            this.logInfo(`CLIProxyAPI not found at "${this.config.executablePath}" — auto-downloading...`);
            const installed = await this.autoInstall();
            if (!installed) {
                return; // error already shown inside autoInstall()
            }
        }

        // Ensure config.yaml exists before login
        this.ensureConfigExists();

        // Stop server if running to avoid file locks
        if (this.process) {
            const selection = await vscode.window.showWarningMessage(
                'The Antigravity server must be stopped to perform login. Stop server now?',
                'Yes', 'No'
            );

            if (selection !== 'Yes') {
                return;
            }

            await this.stop();
        }

        // Detect whether the integrated terminal is PowerShell or cmd.exe.
        // The `&` call operator is PowerShell-only — cmd.exe treats it as a
        // command separator and fails with "& was unexpected at this time."
        const shellConfig = vscode.workspace.getConfiguration('terminal.integrated');
        const defaultProfile: string =
            shellConfig.get<string>('defaultProfile.windows') ??
            shellConfig.get<string>('shell.windows') ?? '';
        const isPowerShell = /powershell|pwsh/i.test(defaultProfile) ||
            (defaultProfile === '' && process.platform === 'win32' && this.isPowerShellAvailable());

        const exePath = this.config.executablePath;
        const loginCmd = isPowerShell
            ? `& "${exePath}" --antigravity-login`
            : `"${exePath}" --antigravity-login`;

        const terminal = vscode.window.createTerminal({
            name: 'Antigravity Login',
            cwd: path.dirname(exePath),
            hideFromUser: false
        });

        terminal.show();
        terminal.sendText(loginCmd);

        vscode.window.showInformationMessage(
            'Follow the instructions in the terminal to login to Antigravity',
            'OK'
        );
    }

    /**
     * Silently download and install CLIProxyAPI, showing only a progress
     * notification. Returns true on success, false if installation failed
     * (an error message is shown to the user in that case).
     */
    private async autoInstall(): Promise<boolean> {
        const result = await vscode.window.withProgress(
            {
                location: vscode.ProgressLocation.Notification,
                title: 'Antigravity: Downloading CLIProxyAPI...',
                cancellable: false
            },
            async (progress) => {
                let lastPercent = 0;
                return await installCLIProxyAPI(
                    (percent) => {
                        const clamped = Math.min(100, percent);
                        const delta = clamped - lastPercent;
                        if (delta > 0) {
                            progress.report({ increment: delta, message: `${clamped}%` });
                            lastPercent = clamped;
                        }
                    },
                    this.output
                );
            }
        );

        if (result.success) {
            if (result.executablePath) {
                // Save to machine-local settings so it never syncs to other machines
                const config = vscode.workspace.getConfiguration('antigravityCopilot');
                await config.update('server.executablePath', result.executablePath, vscode.ConfigurationTarget.Global);
                this.config.executablePath = result.executablePath;
                this.logInfo(`CLIProxyAPI ${result.version} installed at: ${result.executablePath}`);
            }
            vscode.window.showInformationMessage(`Antigravity: CLIProxyAPI ${result.version} installed successfully`);
            return true;
        } else {
            const pick = await vscode.window.showErrorMessage(
                `Antigravity: Failed to download CLIProxyAPI — ${result.error}`,
                'View Logs'
            );
            if (pick === 'View Logs') {
                this.output.show(true);
            }
            return false;
        }
    }

    /** Returns true if PowerShell (powershell.exe or pwsh.exe) is available on PATH. */
    private isPowerShellAvailable(): boolean {
        try {
            
            execSync('powershell.exe -NoProfile -Command "exit 0"', { stdio: 'ignore', timeout: 2000 });
            return true;
        } catch {
            return false;
        }
    }

    private async updateServerConfig(updates: Partial<ServerConfig>): Promise<void> {
        const config = vscode.workspace.getConfiguration('antigravityCopilot');
        for (const [key, value] of Object.entries(updates)) {
            await config.update(`server.${key}`, value, vscode.ConfigurationTarget.Global);
        }
    }

    public async dispose(): Promise<void> {
        this.disposed = true;
        await this.stop();
        this.configChangeDisposable.dispose();
        this._onDidChangeStatus.dispose();
    }

    private async killProcess(proc: ChildProcess): Promise<void> {
        const pid = proc.pid;
        if (!pid) {
            return;
        }

        // Best effort graceful stop first.
        try {
            proc.kill();
        } catch {
            // ignore
        }

        await new Promise<void>((resolve) => {
            if (proc.exitCode !== null) {
                resolve();
                return;
            }
            const timeout = setTimeout(resolve, 5000);
            proc.once('exit', () => {
                clearTimeout(timeout);
                resolve();
            });
        });

        if (proc.exitCode !== null) {
            return;
        }

        // Hard kill fallback.
        if (process.platform === 'win32') {
            await new Promise<void>((resolve) => {
                execFile('taskkill', ['/PID', String(pid), '/T', '/F'], () => resolve());
            });
            return;
        }

        try {
            proc.kill('SIGKILL');
        } catch {
            // ignore
        }
    }
}
