// Lightweight Sanity query client.
//
// In production the query goes through a same-origin proxy (`/sanity/...`,
// rewritten by vercel.json to https://n7hx0w67.apicdn.sanity.io/...), which
// sidesteps Sanity's CORS whitelist entirely (no more 403/ERR_FAILED floods
// in the console when a new deployment domain hasn't been whitelisted yet).
// In local dev we hit the CDN directly so `npm run dev` keeps working.

const projectId = 'n7hx0w67';
const dataset = 'production';
const apiVersion = '2023-05-03';

const isLocal =
  typeof window !== 'undefined' &&
  (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const baseUrl = isLocal
  ? `https://${projectId}.apicdn.sanity.io/${apiVersion}`
  : `/sanity/${apiVersion}`;

const client = {
  fetch(groq) {
    // encodeURIComponent (not URLSearchParams) matches the official
    // @sanity/client encoding byte-for-byte (%20 for spaces, etc.)
    const queryString = `query=${encodeURIComponent(groq)}`;

    return fetch(`${baseUrl}/data/query/${dataset}?${queryString}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Sanity query failed (${res.status})`);
        }
        return res.json();
      })
      .then((json) => json.result);
  },
};

export default client;
