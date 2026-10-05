const { spawn } = require('child_process');
const http = require('http');
const net = require('net');
const path = require('path');

const BACKEND_HEALTH_URL = 'http://localhost:8000/health';
const FRONTEND_URL = 'http://localhost:3000';
const BACKEND_CWD = path.resolve('C:/Jarvis project/manish.py');
const BACKEND_PYTHON = path.join(BACKEND_CWD, 'venv', 'Scripts', 'python.exe');
const FRONTEND_CWD = path.resolve('C:/Jarvis project/jarvis');

const NEXT_BIN = path.join(FRONTEND_CWD, 'node_modules', 'next', 'dist', 'bin', 'next');
const ELECTRON_BIN = path.join(FRONTEND_CWD, 'node_modules', 'electron', 'cli.js');

function isPortInUse(port, host = '127.0.0.1') {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(1000);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, host);
  });
}

function checkHttp(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(res.statusCode >= 200 && res.statusCode < 500);
    });
    req.on('error', () => resolve(false));
    req.setTimeout(2000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitForService(port, url, name, timeoutMs = 60000, intervalMs = 1000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const portOpen = await isPortInUse(port);
    if (portOpen) {
      const httpOk = await checkHttp(url);
      if (httpOk) {
        console.log(`[JARVIS STARTUP] ${name} is fully operational at ${url}`);
        return true;
      }
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  console.error(`[JARVIS STARTUP] Timed out waiting for ${name} at ${url}`);
  return false;
}

async function main() {
  console.log('==================================================');
  console.log('       JARVIS SINGLE COMMAND STARTUP              ');
  console.log('==================================================');

  const spawnedProcesses = [];

  // 1. Check & Start Backend (Port 8000)
  const backendPortOccupied = await isPortInUse(8000);
  if (backendPortOccupied) {
    console.log('[JARVIS STARTUP] Port 8000 is already occupied. (Reusing existing FastAPI backend instance)');
  } else {
    console.log('[JARVIS STARTUP] Starting FastAPI backend on http://localhost:8000...');
    const backendProc = spawn(
      BACKEND_PYTHON,
      ['-m', 'uvicorn', 'api.main:app', '--host', '0.0.0.0', '--port', '8000'],
      { cwd: BACKEND_CWD, stdio: 'inherit' }
    );
    spawnedProcesses.push(backendProc);
  }

  // 2. Check & Start Frontend (Port 3000)
  const frontendPortOccupied = await isPortInUse(3000);
  if (frontendPortOccupied) {
    console.log('[JARVIS STARTUP] Port 3000 is already occupied. (Reusing existing Next.js frontend instance)');
  } else {
    console.log('[JARVIS STARTUP] Starting Next.js frontend on http://localhost:3000...');
    const frontendProc = spawn(
      process.execPath,
      [NEXT_BIN, 'dev', '-p', '3000'],
      { cwd: FRONTEND_CWD, stdio: 'inherit' }
    );
    spawnedProcesses.push(frontendProc);
  }

  // 3. Wait for services to be ready
  console.log('[JARVIS STARTUP] Verifying backend and frontend readiness...');
  const [backendOk, frontendOk] = await Promise.all([
    waitForService(8000, BACKEND_HEALTH_URL, 'FastAPI Backend'),
    waitForService(3000, FRONTEND_URL, 'Next.js Frontend'),
  ]);

  if (!backendOk || !frontendOk) {
    console.error('[JARVIS STARTUP] Startup error: One or more services failed to respond.');
  }

  // 4. Launch Electron UI
  console.log('[JARVIS STARTUP] Both services ready! Launching Electron UI...');
  const electronProc = spawn(
    process.execPath,
    [ELECTRON_BIN, '.'],
    {
      cwd: FRONTEND_CWD,
      stdio: 'inherit',
      env: { ...process.env, ELECTRON_START_URL: FRONTEND_URL },
    }
  );
  spawnedProcesses.push(electronProc);

  // 5. Clean process termination
  const cleanup = () => {
    console.log('\n[JARVIS STARTUP] Shutting down spawned processes...');
    for (const proc of spawnedProcesses) {
      if (proc && proc.pid) {
        try {
          if (process.platform === 'win32') {
            spawn('taskkill', ['/pid', proc.pid.toString(), '/f', '/t']);
          } else {
            proc.kill('SIGINT');
          }
        } catch (e) {
          // ignore cleanup errors
        }
      }
    }
    process.exit(0);
  };

  electronProc.on('exit', () => {
    console.log('[JARVIS STARTUP] Electron closed. Cleaning up session...');
    cleanup();
  });

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

main().catch((err) => {
  console.error('[JARVIS STARTUP] Critical Startup Error:', err);
  process.exit(1);
});
