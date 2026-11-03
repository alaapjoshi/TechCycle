import { readFile, writeFile, mkdir, access, chmod } from 'node:fs/promises';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (!stdin.isTTY || !stdout.isTTY) {
  console.error('Run setup in an interactive terminal. Alternatively copy .env.example to .env and server/.env.example to server/.env.');
  process.exit(1);
}
let rl = createInterface({ input: stdin, output: stdout });
async function hidden(prompt) {
  // Temporarily mask terminal input, including paste; never print the private key.
  rl.close();
  stdout.write(prompt);
  const previousRaw = stdin.isRaw;
  stdin.setRawMode(true);
  stdin.resume();
  try {
    return await new Promise((resolve, reject) => {
      let value = '';
      const done = (error) => {
        stdin.off('data', onData);
        if (error) reject(error); else resolve(value);
      };
      const onData = chunk => {
        for (const character of chunk.toString()) {
          if (character === '\u0003') return done(new Error('Setup cancelled.'));
          if (character === '\r' || character === '\n') return done();
          if (character === '\u007f' || character === '\b') value = value.slice(0, -1);
          else if (character >= ' ') value += character;
        }
      };
      stdin.on('data', onData);
    });
  } finally {
    stdin.setRawMode(previousRaw);
    stdout.write('\n');
    rl = createInterface({ input: stdin, output: stdout });
  }
}
const exists = async file => { try { await access(file); return true; } catch { return false; } };
const safeValue = value => {
  if (/[\r\n\x00]/.test(value)) throw new Error('Settings must be a single line.');
  // These fields are API credentials, identifiers, hostnames or URLs, never free text.
  if (!/^[A-Za-z0-9_./:@?=&%+~-]*$/.test(value)) throw new Error('A setting contains unsupported characters.');
  return value;
};
try {
  console.log('TechCycle local setup. Private OpenAI credentials stay in server/.env.');
  const appFile = path.join(root, '.env');
  const serverFile = path.join(root, 'server/.env');
  if (await exists(appFile) || await exists(serverFile)) {
    const answer = await rl.question('Local settings already exist. Replace both files? Type yes to replace: ');
    if (answer.trim() !== 'yes') { console.log('Existing settings kept.'); rl.close(); process.exit(0); }
  }
  const key = safeValue((await hidden('OpenAI API key (hidden; leave blank to configure later): ')).trim());
  const model = safeValue((await rl.question('OpenAI model [gpt-4.1-mini]: ')).trim() || 'gpt-4.1-mini');
  let app = await readFile(path.join(root, '.env.example'), 'utf8');
  for (const variable of [...app.matchAll(/^(EXPO_PUBLIC_[A-Z_]+)=(.*)$/gm)]) {
    const [line, name, fallback] = variable;
    const value = safeValue((await rl.question(`${name}${fallback ? ` [${fallback}]` : ' (blank to configure later)'}: `)).trim() || fallback);
    app = app.replace(line, `${name}=${value}`);
  }
  await mkdir(path.dirname(serverFile), { recursive: true });
  await writeFile(serverFile, `OPENAI_API_KEY=${key}\nOPENAI_MODEL=${model}\n`, { mode: 0o600 });
  await writeFile(appFile, app, { mode: 0o600 });
  await chmod(serverFile, 0o600);
  await chmod(appFile, 0o600);
  console.log('Saved ignored local settings. Run npm run server, then npm run ios in another terminal.');
} catch (error) { console.error(error.message); process.exitCode = 1; }
finally { rl.close(); }
