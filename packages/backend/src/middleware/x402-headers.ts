import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to add HTTP 402 Payment Required headers
 * These headers allow AI agents and browsers to discover payment requirements
 */
export function add402Headers(
  price: number,
  currency: string = 'USDC',
  paymentAddress?: string
) {
  return (_req: Request, res: Response, next: NextFunction) => {
    // Add payment discovery headers
    res.setHeader('Accept-Payment', 'USDC-Solana');
    res.setHeader('Payment-Required', 'true');
    res.setHeader('Price', price.toString());
    res.setHeader('Currency', currency);
    
    if (paymentAddress) {
      res.setHeader('Payment-Address', paymentAddress);
    }
    
    // Add CORS headers for public access
    res.setHeader('Access-Control-Expose-Headers', 'Accept-Payment, Payment-Required, Price, Currency, Payment-Address');
    
    next();
  };
}

/**
 * Middleware to check if payment header exists
 * Returns true if X-Payment header is present
 */
export function hasPaymentHeader(req: Request): boolean {
  return !!req.headers['x-payment'];
}

/**
 * Parse payment proof from X-Payment header
 */
export function parsePaymentHeader(xPayment: string): {
  signature: string;
  network: string;
  timestamp?: number;
} {
  try {
    const parsed = JSON.parse(xPayment);
    return {
      signature: parsed.signature,
      network: parsed.network,
      timestamp: parsed.timestamp || Date.now(),
    };
  } catch (error) {
    throw new Error('Invalid X-Payment header format');
  }
}
