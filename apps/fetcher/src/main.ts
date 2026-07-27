const service = 'fetcher';
const keepAlive = setInterval((): void => undefined, 60_000);

console.log(JSON.stringify({ level: 'info', service, event: 'process.started' }));

function shutdown(signal: NodeJS.Signals): void {
  console.log(JSON.stringify({ level: 'info', service, event: 'process.stopping', signal }));
  clearInterval(keepAlive);
}

process.once('SIGINT', (): void => shutdown('SIGINT'));
process.once('SIGTERM', (): void => shutdown('SIGTERM'));
