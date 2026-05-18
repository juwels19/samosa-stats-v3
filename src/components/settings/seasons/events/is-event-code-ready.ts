export function isEventCodeReady(eventCode: string) {
  const trimmedEventCode = eventCode.trim();
  return /^[a-zA-Z0-9]{2,}$/.test(trimmedEventCode) && trimmedEventCode.length >= 5;
}
