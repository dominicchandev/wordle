class Logger {
    constructor(private name: string) {}
  
    private formatMessage(level: string, message: string): string {
      return `[${this.name} ${new Date().toISOString()}] ${level}: ${message}`;
    }
  
    info(message: string): void {
      console.log(this.formatMessage('INFO', message));
    }
  
    error(message: string): void {
      console.error(this.formatMessage('ERROR', message));
    }
  }
  
export default Logger;