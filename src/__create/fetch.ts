import * as SecureStore from 'expo-secure-store';
import { fetch as expoFetch } from 'expo/fetch';

const originalFetch = fetch;
const authKey = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID}-jwt`;

const getURLFromArgs = (...args: Parameters<typeof fetch>) => {
  const [urlArg] = args;
  let url: string | null;
  if (typeof urlArg === 'string') {
    url = urlArg;
  } else if (typeof urlArg === 'object' && urlArg !== null && 'url' in urlArg) {
    url = (urlArg as { url: string }).url;
  } else {
    url = null;
  }
  return url;
};

const isFileURL = (url: string) => {
  return url.startsWith('file://') || url.startsWith('data:');
};

const isFirstPartyURL = (url: string) => {
  return (
    url.startsWith('/') ||
    (process.env.EXPO_PUBLIC_BASE_URL && url.startsWith(process.env.EXPO_PUBLIC_BASE_URL))
  );
};

const isSecondPartyURL = (url: string) => {
  return url.startsWith('/_create/');
};

type Params = Parameters<typeof expoFetch>;
const fetchToWeb = async function fetchWithHeaders(...args: Params) {
  const firstPartyURL = process.env.EXPO_PUBLIC_BASE_URL;
  const secondPartyURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL;
  
  // Debug: Log env vars on first fetch to verify they're loaded
  if (!firstPartyURL && !secondPartyURL) {
    console.warn('[Fetch] WARNING: EXPO_PUBLIC_BASE_URL and EXPO_PUBLIC_PROXY_BASE_URL are not set!');
    console.warn('[Fetch] Available env vars:', Object.keys(process.env).filter(k => k.startsWith('EXPO_PUBLIC')));
  }
  
  const [input, init] = args;
  const url = getURLFromArgs(input, init);
  if (!url) {
    return expoFetch(input, init);
  }

  if (isFileURL(url)) {
    return originalFetch(input, init);
  }

  const isExternalFetch = !isFirstPartyURL(url);
  // we should not add headers to requests that don't go to our own server
  if (isExternalFetch) {
    return expoFetch(input, init);
  }

  // Handle relative URLs - this needs to happen even if env vars are missing
  let finalInput = input;
  if (typeof input === 'string' && input.startsWith('/')) {
    // If no base URL is configured, relative URLs will fail in React Native
    if (!firstPartyURL && !secondPartyURL) {
      console.error(
        'EXPO_PUBLIC_BASE_URL and EXPO_PUBLIC_PROXY_BASE_URL are not set. ' +
        'Relative URLs will not work in React Native. URL:', input
      );
      throw new Error(
        `Cannot make request to relative URL "${input}" without EXPO_PUBLIC_BASE_URL set. ` +
        'Please configure your environment variables in your build configuration.'
      );
    }
    const baseURL = isSecondPartyURL(url) ? secondPartyURL : firstPartyURL;
    finalInput = `${baseURL}${input}`;
    console.log('[Fetch] Converted relative URL:', {
      original: input,
      baseURL,
      final: finalInput,
    });
  } else if (typeof input !== 'string') {
    return expoFetch(input, init);
  }

  // If env vars are missing and it's not a relative URL, proceed without headers
  if (!firstPartyURL && !secondPartyURL) {
    return expoFetch(finalInput, init);
  }

  const initHeaders = init?.headers ?? {};
  const finalHeaders = new Headers(initHeaders);

  const headers = {
    'x-createxyz-project-group-id': process.env.EXPO_PUBLIC_PROJECT_GROUP_ID,
    host: process.env.EXPO_PUBLIC_HOST,
    'x-forwarded-host': process.env.EXPO_PUBLIC_HOST,
    'x-createxyz-host': process.env.EXPO_PUBLIC_HOST,
  };

  for (const [key, value] of Object.entries(headers)) {
    if (value) {
      finalHeaders.set(key, value);
    }
  }

  const auth = await SecureStore.getItemAsync(authKey)
    .then((auth) => {
      return auth ? JSON.parse(auth) : null;
    })
    .catch(() => {
      return null;
    });

  if (auth) {
    finalHeaders.set('authorization', `Bearer ${auth.jwt}`);
  }

  // Log the final request details for debugging
  const allHeaders: Record<string, string> = {};
  finalHeaders.forEach((value, key) => {
    allHeaders[key] = value;
  });
  
  console.log('[Fetch] Making request:', {
    url: finalInput,
    method: init?.method || 'GET',
    hasBody: !!init?.body,
    bodyPreview: init?.body ? (typeof init.body === 'string' ? init.body.substring(0, 100) : 'object') : undefined,
    headers: allHeaders,
    headerCount: Object.keys(allHeaders).length,
    hasAuth: !!allHeaders.authorization,
    hasProjectGroupId: !!allHeaders['x-createxyz-project-group-id'],
    hasHost: !!allHeaders.host,
    envVars: {
      hasBaseURL: !!firstPartyURL,
      hasProjectGroupId: !!process.env.EXPO_PUBLIC_PROJECT_GROUP_ID,
      hasHost: !!process.env.EXPO_PUBLIC_HOST,
    },
  });

  return expoFetch(finalInput, {
    ...init,
    headers: finalHeaders,
  });
};

export default fetchToWeb;
