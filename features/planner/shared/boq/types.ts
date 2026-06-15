export type BoqLineItem = {  
  catalogId: string;  
  name: string;  
  sku: string;  
  category: string;  
  quantity: number;  
  unitPriceInr: number;  
  dimensions: {  
    widthMm: number;  
    depthMm: number;  
    heightMm: number;  
  };  
};  
  
export type BoqSummary = {
  lineItems: BoqLineItem[];
  totalItems: number;
  /** Subtotal before tax (INR). Preserved for backward consumers. */
  totalPriceInr: number;
  generatedAt: string;
  /** India GST support (additive per STRATEGIC-GAPS + PLANNER M4/M6 / PR3). Default 18% for furniture. */
  subtotalInr: number;
  gstRate: number; // e.g. 0.18
  gstAmountInr: number;
  grandTotalInr: number;
};
