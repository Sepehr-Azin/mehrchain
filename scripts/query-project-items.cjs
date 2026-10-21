const { execSync } = require('child_process');
const fs = require('fs');
const https = require('https');

const GITHUB_IPS = ['140.82.121.6', '140.82.121.5', '140.82.113.6', '140.82.114.6', '140.82.112.6'];

function makeLookup(ip) {
  return (hostname, options, cb) => {
    if (typeof options === 'function') { cb = options; options = {}; }
    return cb(null, [{ address: ip, family: 4 }]);
  };
}

function graphql(query, variables, token) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query, variables });
    let lastError;
    function tryIp(index) {
      if (index >= GITHUB_IPS.length) return reject(lastError || new Error('All IPs failed'));
      const req = https.request({
        hostname: 'api.github.com',
        path: '/graphql',
        method: 'POST',
        headers: {
          'User-Agent': 'MehrChain-Bot',
          'Authorization': 'Bearer ' + token,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Content-Length': Buffer.byteLength(body),
        },
        lookup: makeLookup(GITHUB_IPS[index]),
        servername: 'api.github.com',
        timeout: 15000,
      }, (res) => {
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => {
          try { resolve(JSON.parse(data)); } catch { resolve({ raw: data }); }
        });
      });
      req.on('timeout', () => req.destroy());
      req.on('error', err => { lastError = err; tryIp(index + 1); });
      req.write(body);
      req.end();
    }
    tryIp(0);
  });
}

function getToken() {
  const creds = execSync('git credential fill', { input: 'protocol=https\nhost=github.com\n\n' }).toString();
  const m = creds.match(/password=(.+)/);
  return m ? m[1].trim() : null;
}

async function run() {
  const token = getToken();
  const res = await graphql(`
    query {
      node(id: "PVT_kwHOAgpOTc4BkCJE") {
        ... on ProjectV2 {
          title
          items(first: 100) {
            totalCount
            nodes {
              id
              content {
                __typename
                ... on Issue {
                  number
                  title
                  state
                }
                ... on PullRequest {
                  number
                  title
                  state
                }
              }
              fieldValues(first: 10) {
                nodes {
                  ... on ProjectV2ItemFieldSingleSelectValue {
                    name
                    field {
                      ... on ProjectV2SingleSelectField {
                        name
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  `, {}, token);

  fs.writeFileSync('project-items-current.json', JSON.stringify(res, null, 2));
  console.log('Total items in project board:', res?.data?.node?.items?.totalCount);
  const items = res?.data?.node?.items?.nodes || [];
  for (const it of items) {
    const content = it.content;
    const status = it.fieldValues?.nodes?.find(f => f.field?.name === 'Status')?.name;
    const priority = it.fieldValues?.nodes?.find(f => f.field?.name === 'Priority')?.name;
    console.log(`Item ${it.id}: ${content?.__typename || 'NO_CONTENT'} #${content?.number || '-'} [${content?.state || '-'}] ${content?.title || 'Ghost'} | Status: ${status} | Priority: ${priority}`);
  }
}

run().catch(console.error);
