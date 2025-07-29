export interface ParsedCommand {
  cmd: 'trade' | 'metrics' | 'help' | 'unknown';
  args: string;
}

export default function parseCommand(input: string): ParsedCommand {
  if (!input.startsWith('/')) return { cmd: 'unknown', args: input };

  const [slash, ...rest] = input.trim().split(' ');
  const cmd = slash.slice(1) as ParsedCommand['cmd'];
  const args = rest.join(' ');
  switch (cmd) {
    case 'trade':
    case 'metrics':
    case 'help':
      return { cmd, args };
    default:
      return { cmd: 'unknown', args: input };
  }
}