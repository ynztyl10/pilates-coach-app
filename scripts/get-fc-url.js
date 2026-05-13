const fc = require('@alicloud/fc20230330');

async function main() {
  const client = new fc.default({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    regionId: 'cn-hangzhou',
    endpoint: 'fcv3.cn-hangzhou.aliyuncs.com',
  });

  try {
    const result = await client.getFunction('pilates-api', new fc.GetFunctionRequest({}));
    console.log('Function details:');
    console.log(JSON.stringify(result.body, null, 2));
  } catch (err) {
    console.error('Failed:', err.message);
    if (err.data) console.error('Data:', JSON.stringify(err.data, null, 2));
  }
}

main();
