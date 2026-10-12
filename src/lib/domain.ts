/**
 * Client-side domain normalization helper
 */

export interface NormalizedDomainResult {
  isValid: boolean;
  domain: string;
  cleanUrl: string;
  subdomain?: string;
  error?: string;
}

export function normalizeDomainClient(rawUrl: string): NormalizedDomainResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return {
      isValid: false,
      domain: '',
      cleanUrl: '',
      error: 'Please enter a URL or domain.',
    };
  }

  let trimmed = rawUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      domain: '',
      cleanUrl: '',
      error: 'URL cannot be empty.',
    };
  }

  // Prepend protocol if missing for URL parsing
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = 'https://' + trimmed;
  }

  try {
    const urlObj = new URL(trimmed);
    let hostname = urlObj.hostname.toLowerCase();

    // Strip leading www.
    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    if (!hostname || !hostname.includes('.')) {
      return {
        isValid: false,
        domain: '',
        cleanUrl: '',
        error: 'Must include a valid domain extension (e.g. .com, .io, .org).',
      };
    }

    const hostnameRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]{2,}$/i;
    if (!hostnameRegex.test(hostname)) {
      return {
        isValid: false,
        domain: '',
        cleanUrl: '',
        error: 'Invalid characters in domain name.',
      };
    }

    return {
      isValid: true,
      domain: hostname,
      cleanUrl: urlObj.href,
    };
  } catch {
    return {
      isValid: false,
      domain: '',
      cleanUrl: '',
      error: 'Invalid URL format.',
    };
  }
}
