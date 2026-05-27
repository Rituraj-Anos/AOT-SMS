/**
 * Renders plain text with basic rich formatting:
 * - Line breaks preserved
 * - URLs become clickable links
 * - **bold** text rendered as bold
 * - Emoji preserved as-is
 */
export function RichText({ text, className }: { text: string; className?: string }) {
  const lines = text.split('\n');

  return (
    <div className={className}>
      {lines.map((line, i) => (
        <p key={i} className={line.trim() === '' ? 'h-2' : 'mb-1'}>
          {renderLine(line)}
        </p>
      ))}
    </div>
  );
}

function renderLine(line: string): React.ReactNode[] {
  // Split by bold markers and URLs
  const parts: React.ReactNode[] = [];
  // Regex: match **bold**, URLs, or plain text
  const regex = /(\*\*[^*]+\*\*|https?:\/\/[^\s,)]+)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = regex.exec(line)) !== null) {
    // Add text before match
    if (match.index > lastIndex) {
      parts.push(line.slice(lastIndex, match.index));
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      // Bold text
      parts.push(
        <strong key={match.index} className="font-semibold text-foreground">
          {token.slice(2, -2)}
        </strong>
      );
    } else if (token.startsWith('http')) {
      // URL link
      parts.push(
        <a
          key={match.index}
          href={token}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline break-all"
        >
          {token.length > 50 ? token.slice(0, 50) + '…' : token}
        </a>
      );
    }
    lastIndex = match.index + token.length;
  }

  // Add remaining text
  if (lastIndex < line.length) {
    parts.push(line.slice(lastIndex));
  }

  return parts;
}
