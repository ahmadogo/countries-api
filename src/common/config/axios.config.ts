import axios from 'axios';
import https from 'https';

// 🔐 Custom HTTPS agent — allows TLS negotiation and bypasses proxies
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,   // (safe for dev; set to true in production)
  secureProtocol: 'TLS_method', // auto-negotiates best TLS version
});

// ✅ Apply globally
axios.defaults.httpsAgent = httpsAgent;
axios.defaults.proxy = false; // bypass system/corporate proxy
axios.defaults.timeout = 15000;
axios.defaults.headers.common['Accept'] = 'application/json';

// Optional global error logging
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Global Axios error:', error?.message);
    return Promise.reject(error);
  },
);

export default axios;
