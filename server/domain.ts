/**
 * Domain normalization and validation utility for Storvia
 */

export interface NormalizedDomainResult {
  isValid: boolean;
  domain: string;
  cleanUrl: string;
  subdomain?: string;
  error?: string;
}

export function normalizeDomain(rawUrl: string): NormalizedDomainResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      domain: '',
      cleanUrl: '',
      error: 'Please enter a valid website URL or domain name.',
    };
  }

  let trimmed = rawUrl.trim();

  // If user entered without protocol, prepend https://
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }

  try {
    const urlObj = new URL(trimmed);
    let hostname = urlObj.hostname.toLowerCase();

    // Remove leading 'www.'
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    // Disallow IP addresses or invalid domains
    if (!hostname || hostname.includes(' ') || !hostname.includes('.')) {
      return {
        isValid: false,
        domain: '',
        cleanUrl: '',
        error: 'Invalid domain format. Domain must contain a valid top-level domain (e.g. example.com).',
      };
    }

    // Hostname regex validation (supports internationalized ASCII or standard domain names)
    const hostnameRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,}$/i;
    if (!hostnameRegex.test(hostname)) {
      return {
        isValid: false,
        domain: '',
        cleanUrl: '',
        error: 'Please enter a valid domain name (e.g. example.com or app.example.com).',
      };
    }

    // Build the cleaned original URL
    const cleanUrl = urlObj.href;

    // Detect subdomain if more than 2 parts (taking common 2-part TLDs into consideration)
    const parts = hostname.split('.');
    let subdomain: string | undefined = undefined;
    if (parts.length > 2) {
      // e.g. app.demo.com -> subdomain 'app'
      const isCoUk = parts.length > 2 && (parts[parts.length - 2] === 'co' || parts[parts.length - 2] === 'com') && parts[parts.length - 1].length === 2;
      if (isCoUk && parts.length > 3) {
        subdomain = parts.slice(0, parts.length - 3).join('.');
      } else if (!isCoUk) {
        subdomain = parts.slice(0, parts.length - 2).join('.');
      }
    }

    return {
      isValid: true,
      domain: hostname,
      cleanUrl,
      subdomain,
    };
  } catch {
    return {
      isValid: false,
      domain: '',
      cleanUrl: '',
      error: 'Could not parse the provided URL. Ensure it follows standard web URL format.',
    };
  }
}
