export class QRService {
  private static instance: QRService;

  private constructor() {}

  static getInstance(): QRService {
    if (!QRService.instance) {
      QRService.instance = new QRService();
    }
    return QRService.instance;
  }

  // Generate QR code data URL for a wallet address
  generateQRCodeDataURL(address: string, amount?: number): string {
    // For demo purposes, create a simple text QR data
    // In production, you would use a proper QR code library like react-native-qrcode-svg
    let qrData = address;
    
    if (amount) {
      qrData = `${address}?amount=${amount}`;
    }

    // Return a mock SVG QR code for demonstration
    // In production, integrate with a real QR code library
    return `data:image/svg+xml;base64,${this.createMockQRSVG(qrData)}`;
  }

  private createMockQRSVG(data: string): string {
    // Create a simple mock QR code SVG
    const svg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <rect x="10" y="10" width="30" height="30" fill="black"/>
        <rect x="160" y="10" width="30" height="30" fill="black"/>
        <rect x="10" y="160" width="30" height="30" fill="black"/>
        <rect x="50" y="50" width="20" height="20" fill="black"/>
        <rect x="130" y="50" width="20" height="20" fill="black"/>
        <rect x="50" y="130" width="20" height="20" fill="black"/>
        <rect x="130" y="130" width="20" height="20" fill="black"/>
        <rect x="90" y="90" width="20" height="20" fill="black"/>
        <!-- More mock QR pattern -->
        <text x="100" y="220" text-anchor="middle" font-size="8" fill="gray">QR Code for: ${data.substring(0, 20)}...</text>
      </svg>
    `.trim();

    // Use btoa instead of Buffer for React Native compatibility
    return btoa(svg);
  }

  // Create a payment URI for the given address and amount
  createPaymentURI(address: string, amount?: number, label?: string): string {
    let uri = address;
    
    if (amount || label) {
      const params = new URLSearchParams();
      if (amount) params.append('amount', amount.toString());
      if (label) params.append('label', label);
      uri += '?' + params.toString();
    }
    
    return uri;
  }
}

export const qrService = QRService.getInstance(); 