export type VisualIvrActionType = "contact" | "info" | "link";
export type VisualIvrIconId = "user" | "phone" | "info" | "arrow-right";

export type VisualIvrNode = {
  id: string;
  label: string;
  icon?: VisualIvrIconId;
  description?: string;
  options?: VisualIvrNode[];
  action?: {
    type: VisualIvrActionType;
    value: string;
    detail?: string;
  };
};

export const VISUAL_IVR_TREE: VisualIvrNode = {
  id: "root",
  label: "Main Menu",
  options: [
    {
      id: "sales",
      label: "Sales & Product Requests",
      icon: "user",
      description: "Request a quote or product information",
      options: [
        {
          id: "sales_de",
          label: "Domestic (India)",
          action: {
            type: "contact",
            value: "+91 124 403 1666",
            detail: "sales@oando.co.in",
          },
        },
        {
          id: "sales_int",
          label: "International Sales",
          action: {
            type: "contact",
            value: "+91 124 403 1666",
            detail: "export@oando.co.in",
          },
        },
        {
          id: "dealer",
          label: "Find a Dealer",
          action: {
            type: "link",
            value: "/contact",
            detail: "Use our Dealer Locator",
          },
        },
      ],
    },
    {
      id: "support",
      label: "Customer Support",
      icon: "phone",
      description: "Help with existing orders or products",
      options: [
        {
          id: "order_status",
          label: "Order Status",
          action: {
            type: "info",
            value: "Please have your order confirmation number ready.",
          },
        },
        {
          id: "claims",
          label: "Complaints & Claims",
          action: {
            type: "contact",
            value: "service@oando.co.in",
            detail: "Attach photos for faster processing",
          },
        },
        {
          id: "spare_parts",
          label: "Spare Parts",
          action: {
            type: "link",
            value: "/products",
            detail: "Check product manuals first",
          },
        },
      ],
    },
    {
      id: "general",
      label: "General Inquiry",
      icon: "info",
      description: "Reception and general enquiries",
      options: [
        {
          id: "reception",
          label: "Reception / Switchboard",
          action: {
            type: "contact",
            value: "+91 124 403 1666",
            detail: "Mon-Sat 9:30 - 18:30 IST",
          },
        },
        {
          id: "careers",
          label: "Careers",
          action: {
            type: "link",
            value: "/career",
            detail: "View open positions",
          },
        },
        {
          id: "press",
          label: "Press & Marketing",
          action: {
            type: "contact",
            value: "marketing@oando.co.in",
          },
        },
      ],
    },
  ],
};
