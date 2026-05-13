const fc = require('@alicloud/fc20230330');

async function main() {
  const client = new fc.default({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    regionId: 'cn-hangzhou',
    endpoint: 'fcv3.cn-hangzhou.aliyuncs.com',
  });

  const input = new fc.CreateCustomDomainInput({
    domainName: 'api.gundam3d.cn',
    protocol: 'HTTP',
    routeConfig: {
      routes: [
        {
          functionName: 'pilates-api',
          path: '/*',
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        },
      ],
    },
  });

  const request = new fc.CreateCustomDomainRequest({ body: input });

  try {
    const result = await client.createCustomDomain(request);
    console.log('Custom domain created!');
    console.log(JSON.stringify(result.body, null, 2));
  } catch (err) {
    console.error('Failed:', err.message);
    if (err.data) console.error('Data:', JSON.stringify(err.data, null, 2));
  }
}

main();
