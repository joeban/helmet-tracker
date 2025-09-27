declare global {
  interface Window {
    gtag: (
      command: 'config' | 'event' | 'js' | 'set',
      targetId: string | Date,
      config?: Record<string, unknown>
    ) => void;
  }
}

export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const pageview = (url: string) => {
  if (!GA_MEASUREMENT_ID) return;

  window.gtag('config', GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string;
  category: string;
  label?: string;
  value?: number;
}) => {
  if (!GA_MEASUREMENT_ID) return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

// Specific tracking for helmet interactions
export const trackHelmetView = (helmetName: string, brand: string) => {
  event({
    action: 'view_helmet',
    category: 'helmet_interaction',
    label: `${brand} - ${helmetName}`,
  });
};

export const trackAmazonClick = (helmetName: string, brand: string) => {
  event({
    action: 'amazon_click',
    category: 'affiliate_link',
    label: `${brand} - ${helmetName}`,
  });
};

export const trackFilterUsage = (filterType: string, filterValue: string) => {
  event({
    action: 'filter_used',
    category: 'search_interaction',
    label: `${filterType}: ${filterValue}`,
  });
};