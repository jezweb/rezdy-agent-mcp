export interface PricingCalculation {
  subtotal: number;
  fees: number;
  taxes: number;
  total: number;
  currency: string;
  agentCommission?: number;
  agentDiscount?: number;
  netPrice?: number;
}

export function calculateAgentPricing(
  basePrice: number,
  commissionRate: number = 0,
  discountRate: number = 0,
  fees: number = 0,
  taxRate: number = 0,
  currency: string = 'USD'
): PricingCalculation {
  const subtotal = basePrice;
  const agentDiscount = subtotal * (discountRate / 100);
  const discountedPrice = subtotal - agentDiscount;
  const taxes = discountedPrice * (taxRate / 100);
  const total = discountedPrice + fees + taxes;
  const agentCommission = total * (commissionRate / 100);
  const netPrice = total - agentCommission;

  return {
    subtotal,
    fees,
    taxes,
    total,
    currency,
    agentCommission,
    agentDiscount,
    netPrice,
  };
}

export function formatPrice(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount);
}

export function calculateTotalQuantityPrice(
  quantities: Array<{ optionId: number; value: number }>,
  pricing: Array<{ optionId: number; price: number; agentPrice?: number }>,
  useAgentPricing: boolean = false
): number {
  return quantities.reduce((total, quantity) => {
    const priceOption = pricing.find(p => p.optionId === quantity.optionId);
    if (!priceOption) return total;
    
    const unitPrice = useAgentPricing && priceOption.agentPrice 
      ? priceOption.agentPrice 
      : priceOption.price;
    
    return total + (unitPrice * quantity.value);
  }, 0);
}