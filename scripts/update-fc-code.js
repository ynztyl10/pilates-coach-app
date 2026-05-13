const fc = require('@alicloud/fc20230330');

async function main() {
  const client = new fc.default({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    regionId: 'cn-hangzhou',
    endpoint: 'fcv3.cn-hangzhou.aliyuncs.com',
  });

  const input = new fc.UpdateFunctionInput({
    code: new fc.InputCodeLocation({
      ossBucketName: 'pilates-coach-handbook',
      ossObjectName: 'deploy/backend.zip',
    }),
  });

  const request = new fc.UpdateFunctionRequest({ body: input });

  try {
    const result = await client.updateFunction('pilates-api', request);
    console.log('Function updated successfully!');
    console.log('codeChecksum:', result.body.codeChecksum);
  } catch (err) {
    console.error('Failed:', err.message);
    if (err.data) console.error('Data:', JSON.stringify(err.data, null, 2));
    process.exit(1);
  }
}

main();
