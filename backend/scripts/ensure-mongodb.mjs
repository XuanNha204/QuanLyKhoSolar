import { spawn } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const workspaceDir = resolve(scriptDir, '..', '..');
const dataDir = resolve(workspaceDir, '.mongodb', 'data');
const logPath = resolve(workspaceDir, '.mongodb', 'mongod.log');
const port = Number(process.env.SOLAR_MONGODB_PORT ?? 27018);
const host = `127.0.0.1:${port}`;
const directUri = `mongodb://${host}/admin?directConnection=true`;

function resolveMongod() {
  const candidates = [
    process.env.MONGOD_PATH,
    'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
    'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
    'mongod',
  ].filter(Boolean);
  return (
    candidates.find(
      (candidate) => candidate === 'mongod' || existsSync(candidate),
    ) ?? 'mongod'
  );
}

async function connect() {
  const client = new MongoClient(directUri, { serverSelectionTimeoutMS: 1200 });
  await client.connect();
  return client;
}

async function currentState() {
  try {
    const client = await connect();
    const hello = await client.db('admin').command({ hello: 1 });
    await client.close();
    return hello;
  } catch {
    return null;
  }
}

async function waitFor(predicate, timeoutMs, errorMessage) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const state = await currentState();
    if (state && predicate(state)) return state;
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 500));
  }
  throw new Error(errorMessage);
}

let state = await currentState();
if (!state) {
  mkdirSync(dataDir, { recursive: true });
  const child = spawn(
    resolveMongod(),
    [
      '--dbpath',
      dataDir,
      '--port',
      String(port),
      '--bind_ip',
      '127.0.0.1',
      '--replSet',
      'rs0',
      '--logpath',
      logPath,
      '--logappend',
    ],
    { detached: true, stdio: 'ignore', windowsHide: true },
  );
  child.unref();
  state = await waitFor(
    () => true,
    20_000,
    `MongoDB không khởi động được. Xem log: ${logPath}`,
  );
}

if (state.setName && state.setName !== 'rs0') {
  throw new Error(
    `Cổng ${port} đang dùng replica set ${state.setName}, cần rs0.`,
  );
}

if (!state.setName) {
  const client = await connect();
  try {
    await client.db('admin').command({
      replSetInitiate: { _id: 'rs0', members: [{ _id: 0, host }] },
    });
  } catch (error) {
    if (!String(error).includes('already initialized')) throw error;
  } finally {
    await client.close();
  }
}

await waitFor(
  (hello) => hello.setName === 'rs0' && hello.isWritablePrimary === true,
  30_000,
  'Replica set rs0 chưa sẵn sàng nhận ghi.',
);
console.log(`MongoDB replica set rs0 sẵn sàng tại mongodb://${host}`);
