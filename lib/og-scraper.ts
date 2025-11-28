import ogs from 'open-graph-scraper';
import { OpenGraphData } from '@/types/news';

/**
 * Fetch Open Graph metadata from URL
 * Returns null if scraping fails (graceful fallback)
 */
export async function fetchOpenGraphData(url: string): Promise<OpenGraphData | null> {
  try {
    const { result } = await ogs({
      url,
      timeout: 5000, // 5 second timeout
      fetchOptions: {
        headers: {
          'user-agent': 'Mozilla/5.0 (compatible; ELHadegelBot/1.0; +https://el-hadegel.vercel.app)'
        }
      }
    });

    // Extract OG data with Twitter fallbacks
    const title = result.ogTitle || result.twitterTitle || null;
    const image = result.ogImage?.[0]?.url || result.twitterImage?.[0]?.url || null;
    const description = result.ogDescription || result.twitterDescription || null;
    const siteName = result.ogSiteName || null;

    return {
      title,
      image,
      description,
      siteName,
    };
  } catch (error) {
    console.error('Open Graph scraping failed for URL:', url, error);
    return null; // Graceful fallback - post will be created without preview
  }
}

/**
 * Validate URL to prevent SSRF attacks
 * Enhanced with additional security checks
 */
export function isValidExternalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Only allow http/https
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname.toLowerCase();

    // Block localhost
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
      return false;
    }

    // Block private IPv4 ranges
    if (
      hostname.startsWith('192.168.') || // Private Class C
      hostname.startsWith('10.') ||      // Private Class A
      hostname.startsWith('172.16.') ||  // Private Class B (172.16-31)
      hostname.startsWith('172.17.') ||
      hostname.startsWith('172.18.') ||
      hostname.startsWith('172.19.') ||
      hostname.startsWith('172.20.') ||
      hostname.startsWith('172.21.') ||
      hostname.startsWith('172.22.') ||
      hostname.startsWith('172.23.') ||
      hostname.startsWith('172.24.') ||
      hostname.startsWith('172.25.') ||
      hostname.startsWith('172.26.') ||
      hostname.startsWith('172.27.') ||
      hostname.startsWith('172.28.') ||
      hostname.startsWith('172.29.') ||
      hostname.startsWith('172.30.') ||
      hostname.startsWith('172.31.')
    ) {
      return false;
    }

    // Block link-local addresses
    if (hostname.startsWith('169.254.')) {
      return false;
    }

    // Block metadata service IPs (AWS, GCP, Azure)
    if (
      hostname === '169.254.169.254' || // AWS/Azure metadata
      hostname === 'metadata.google.internal' // GCP metadata
    ) {
      return false;
    }

    // Block file:// and other dangerous protocols
    if (parsed.protocol === 'file:') {
      return false;
    }

    // Block URLs with credentials
    if (parsed.username || parsed.password) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
