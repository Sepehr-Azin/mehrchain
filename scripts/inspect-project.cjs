const https = require('https');
const { execSync } = require('child_process');
const fs = require('fs');

function getToken() {
  let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    try {
      const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n', timeout: 5000 }).toString();
      const m = creds.match(/password=(.+)/);
      if (m) token = m[1].trim();
    } catch {}
  }
  return token;
}

const GITHUB_IPS = ['140.82.121.6', '140.82.121.5', '140.82.113.6', '140.82.114.6', '140.82.112.6'];
function gql(query, variables, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    let lastError;
    function tryIp(index) {
      if (index >= GITHUB_IPS.length) return reject(lastError || new Error('All IPs failed'));
      const ip = GITHUB_IPS[index];
      const req = https.request({
        hostname: 'api.github.com', path: '/graphql', method: 'POST',
        headers: { 'User-Agent': 'MehrChain-Bot', 'Authorization': 'Bearer ' + token, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
        lookup: (h, o, cb) => {
          if (typeof o === 'function') cb = o;
          if (o && o.all) return cb(null, [{ address: ip, family: 4 }]);
          return cb(null, ip, 4);
        },
        servername: 'api.github.com', timeout: 15000
      }, res => {
        let d = ''; res.on('data', c => d += c);
        res.on('end', () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
      });
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', err => { lastError = err; tryIp(index + 1); });
      req.write(body); req.end();
    }
    tryIp(0);
  });
}

async function run() {
  const token = getToken();
  const query = `query {
    node(id: "PVT_kwHOAgpOTc4BkCJE") {
      ... on ProjectV2 {
        id title
        fields(first: 20) {
          nodes {
            ... on ProjectV2Field { id name }
            ... on ProjectV2SingleSelectField { id name options { id name } }
          }
        }
        items(first: 100) {
          totalCount
          nodes {
            id
            content {
              ... on Issue { number title state }
            }
            fieldValues(first: 10) {
              nodes {
                ... on ProjectV2ItemFieldSingleSelectValue {
                  name
                  field { ... on ProjectV2SingleSelectField { name } }
                }
              }
            }
          }
        }
      }
    }
  }`;
  const res = await gql(query, {}, token);
  fs.writeFileSync('project-items.json', JSON.stringify(res, null, 2));
  console.log('Project items saved');
  const items = res.data?.node?.items?.nodes || [];
  console.log('Project item count:', items.length);
  items.forEach(it => {
    const issue = it.content;
    const statusVal = it.fieldValues?.nodes?.find(f => f.field?.name === 'Status')?.name;
    console.log(`Item ${it.id}: Issue #${issue?.number} [${issue?.state}] - ${issue?.title} => Status: ${statusVal}`);
  });
}
run().catch(console.error);
