import { createPasswordHash } from './crypto.js';

async function readPassword(): Promise<string> {
  if (!process.stdin.isTTY) {
    const chunks: Buffer[] = [];
    for await (const chunk of process.stdin) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
    }
    return Buffer.concat(chunks)
      .toString('utf8')
      .replace(/[\r\n]+$/, '');
  }

  return new Promise((resolve, reject) => {
    const input = process.stdin;
    const characters: string[] = [];
    input.setRawMode(true);
    input.setEncoding('utf8');
    process.stderr.write('Owner password: ');

    const cleanup = (): void => {
      input.setRawMode(false);
      input.pause();
      input.removeListener('data', onData);
    };
    const onData = (chunk: string): void => {
      if (chunk === '\u0003') {
        cleanup();
        process.stderr.write('\n');
        reject(new Error('Password input cancelled.'));
        return;
      }
      if (chunk === '\r' || chunk === '\n') {
        cleanup();
        process.stderr.write('\n');
        resolve(characters.join(''));
        return;
      }
      if (chunk === '\u007f') {
        characters.pop();
        return;
      }
      characters.push(chunk);
    };

    input.resume();
    input.on('data', onData);
  });
}

void readPassword()
  .then(createPasswordHash)
  .then((hash) => {
    process.stdout.write(`${hash}\n`);
  })
  .catch((error: unknown) => {
    process.stderr.write(error instanceof Error ? `${error.message}\n` : 'Password hashing failed.\n');
    process.exitCode = 1;
  });
