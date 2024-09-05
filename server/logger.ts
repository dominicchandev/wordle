export default function logWithTimestamp(message: string) {
    console.log(`[${new Date().toISOString()}] ${message}`);
}