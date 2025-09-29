'use client';

import { Helmet } from '@/types/helmet';
import { getHelmetAmazonInfo } from '@/utils/amazonImages';

interface StaticAmazonInfoProps {
  helmet: Helmet;
  className?: string;
}

/**
 * Static Amazon product info component
 * Does NOT make API calls - uses pre-cached data only
 * This prevents rate limiting issues on the public site
 */
export default function StaticAmazonInfo({
  helmet,
  className = ''
}: StaticAmazonInfoProps) {
  // Get stored ASIN and generate static links
  const amazonInfo = getHelmetAmazonInfo(helmet.brand, helmet.name);

  if (amazonInfo.hasAmazonLink && amazonInfo.productUrl) {
    // We have a verified ASIN - show direct link
    return (
      <div className={className}>
        <a
          href={amazonInfo.productUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white font-semibold rounded-lg transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
            <path d="M13.74 12c-.092-.071-.306-.232-.306-.232V9.53c0-.105.008-.21.025-.314h1.745c.085.104.154.22.206.348.05.128.076.267.076.416v.457c0 .085-.02.168-.058.25-.036.082-.092.154-.17.214-.077.061-.178.109-.301.145-.123.036-.267.054-.432.054h-.785c-.085 0-.07.09-.07.175v.755zM10.26 12c.085-.071.306-.232.306-.232V9.53c0-.105-.008-.21-.025-.314H8.796c-.085.104-.154.22-.206.348-.05.128-.076.267-.076.416v.457c0 .085.02.168.058.25.036.082.092.154.17.214.077.061.178.109.301.145.123.036.267.054.432.054h.785c.085 0 .07.09.07.175v.755zM22.5 6.908V17.09c0 .604-.246 1.152-.643 1.549-.397.396-.945.643-1.549.643H3.692c-.604 0-1.152-.247-1.549-.643-.396-.397-.643-.945-.643-1.549V6.908c0-.604.247-1.152.643-1.549.397-.396.945-.643 1.549-.643h16.616c.604 0 1.152.247 1.549.643.397.397.643.945.643 1.549z"/>
          </svg>
          View on Amazon
        </a>
        <div className="text-xs text-gray-500 mt-2">
          Price and availability on Amazon.com
        </div>
      </div>
    );
  }

  // No ASIN - show search link
  return (
    <div className={className}>
      <a
        href={amazonInfo.searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full inline-flex items-center justify-center px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition-colors"
      >
        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        Search on Amazon
      </a>
      <div className="text-xs text-gray-500 mt-2">
        Find this helmet on Amazon.com
      </div>
    </div>
  );
}