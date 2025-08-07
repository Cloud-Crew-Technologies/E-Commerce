/**
 * Barcode generation service for products
 * Generates simple numeric barcodes based on SKU
 */

export async function generateBarcode(sku: string): Promise<string> {
  // Generate a simple barcode pattern based on SKU
  // In a real application, you might use a library like bwip-js
  // For now, we'll create a simple numeric barcode
  
  const timestamp = Date.now().toString().slice(-6);
  const skuHash = sku
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0)
    .toString()
    .padStart(4, '0')
    .slice(0, 4);
    
  return `${skuHash}${timestamp}`;
}

/**
 * Generate barcode pattern for display (visual representation)
 * Returns a string of bars for visual display
 */
export function generateBarcodePattern(barcode: string): string {
  // Convert numeric barcode to a visual pattern
  const patterns: { [key: string]: string } = {
    '0': '||  |',
    '1': '| | |',
    '2': '|  ||',
    '3': '|| ||',
    '4': '||| |',
    '5': '| |||',
    '6': ' ||||',
    '7': ' || |',
    '8': ' | ||',
    '9': '  |||'
  };
  
  return barcode
    .split('')
    .map(digit => patterns[digit] || '|||||')
    .join(' ');
}
