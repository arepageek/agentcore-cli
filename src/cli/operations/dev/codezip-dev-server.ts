import { getVenvExecutable } from '../../../lib/utils/platform';
import type { ProtocolMode } from '../../../schema';
import { DevServer, type LogLevel, type SpawnConfig } from './dev-server';
import { convertEntrypointToModule } from './utils';
import { spawnSync } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

/**
 * Ensures a Python virtual environment exists and has dependencies installed.
 * Creates the venv and runs uv sync if .venv doesn't exist.
 * For non-HTTP protocols, checks for python instead of uvicorn.
 * Returns true if successful, false otherwise.
 */
function ensurePythonVenv(
  cwd: string,
  onLog: (level: LogLevel, message: string) => void,
  protocol: ProtocolMode = 'HTTP'
): boolean {
  const venvPath = join(cwd, '.venv');

  if (protocol === 'HTTP') {
    // For HTTP, uvicorn binary is a reliable proxy for "deps installed"
    const uvicornPath = getVenvExecutable(venvPath, 'uvicorn');
    if (existsSync(uvicornPath)) {
      return true;
    }
  } else {
    // For MCP/A2A, check python binary as a proxy for "venv + deps installed"
    const pythonPath = getVenvExecutable(venvPath, 'python');
    if (existsSync(pythonPath)) {
      return true;
    }
  }

  onLog('system', 'Setting up Python environment...');

  // Create venv if it doesn't exist
  if (!existsSync(venvPath)) {
    onLog('info', 'Creating virtual environment...');
    const venvResult = spawnSync('uv', ['venv'], { cwd, stdio: 'pipe' });
    if (venvResult.status !== 0) {
      onLog('error', `Failed to create venv: ${venvResult.stderr?.toString() || 'unknown error'}`);
      return false;
    }
  }

  // Install dependencies using uv sync (reads from pyproject.toml)
  onLog('info', 'Installing dependencies...');
  const syncResult = spawnSync('uv', ['sync'], { cwd, stdio: 'pipe' });
  if (syncResult.status !== 0) {
    if (protocol === 'HTTP') {
      // Fallback: try installing uvicorn directly if uv sync fails
      onLog('warn', 'uv sync failed, trying direct uvicorn install...');
      const pipResult = spawnSync('uv', ['pip', 'install', 'uvicorn'], { cwd, stdio: 'pipe' });
      if (pipResult.status !== 0) {
        onLog('error', `Failed to install dependencies: ${pipResult.stderr?.toString() || 'unknown error'}`);
        return false;
      }
    } else {
      onLog('error', `Failed to install dependencies: ${syncResult.stderr?.toString() || 'unknown error'}`);
      return false;
    }
  }

  onLog('system', 'Python environment ready');
  return true;
}

/**
 * Ensures Node.js dependencies are installed.
 * Checks for node_modules existence and runs npm install if needed.
 */
function ensureNodeDeps(cwd: string, onLog: (level: LogLevel, message: string) => void): boolean {
  const nodeModulesPath = join(cwd, 'node_modules');
  if (existsSync(nodeModulesPath)) {
    return true;
  }

  onLog('system', 'Installing Node.js dependencies...');
  const result = spawnSync('npm', ['install'], { cwd, stdio: 'pipe' });
  if (result.status !== 0) {
    onLog('error', `Failed to install dependencies: ${result.stderr?.toString() || 'unknown error'}`);
    return false;
  }

  onLog('system', 'Node.js environment ready');
  return true;
}

/** Dev server for CodeZip agents. Runs uvicorn (Python) or npx tsx (Node.js) locally. */
export class CodeZipDevServer extends DevServer {
  protected prepare(): Promise<boolean> {
    if (this.config.isPython) {
      return Promise.resolve(
        ensurePythonVenv(this.config.directory, this.options.callbacks.onLog, this.config.protocol)
      );
    }
    return Promise.resolve(ensureNodeDeps(this.config.directory, this.options.callbacks.onLog));
  }

  protected getSpawnConfig(): SpawnConfig {
    const { module, directory, isPython, protocol } = this.config;
    const { port, envVars = {} } = this.options;
    const env = { ...process.env, ...envVars, PORT: String(port), LOCAL_DEV: '1' };

    if (!isPython) {
      // Node.js/TypeScript: run the entrypoint file directly with tsx
      const entryFile = module.includes(':') ? (module.split(':')[0] ?? module) : module;
      return {
        cmd: 'npx',
        args: ['tsx', 'watch', entryFile],
        cwd: directory,
        env,
      };
    }

    const venvDir = join(directory, '.venv');

    if (protocol !== 'HTTP') {
      // MCP/A2A: run python main.py directly (no module-level ASGI app)
      const python = getVenvExecutable(venvDir, 'python');
      const entryFile = module.split(':')[0] ?? module;
      return { cmd: python, args: [entryFile], cwd: directory, env };
    }

    // HTTP: uvicorn with hot-reload (existing behavior)
    const uvicorn = getVenvExecutable(venvDir, 'uvicorn');
    return {
      cmd: uvicorn,
      args: [convertEntrypointToModule(module), '--reload', '--host', '127.0.0.1', '--port', String(port)],
      cwd: directory,
      env,
    };
  }
}
