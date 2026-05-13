const fc = require('@alicloud/fc20230330');

async function main() {
  const client = new fc.default({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    regionId: 'cn-hangzhou',
    endpoint: 'fcv3.cn-hangzhou.aliyuncs.com',
  });

  const input = new fc.CreateFunctionInput({
    functionName: 'pilates-test',
    runtime: 'nodejs20',
    handler: 'index.handler',
    code: new fc.InputCodeLocation({
      ossBucketName: 'pilates-coach-handbook',
      ossObjectName: 'deploy/test-backend.zip',
    }),
    memorySize: 128,
    timeout: 10,
  });

  const request = new fc.CreateFunctionRequest({ body: input });

  try {
    const result = await client.createFunction(request);
    console.log('Test function created!');
    console.log(JSON.stringify(result.body, null, 2));
  } catch (err) {
    console.error('Failed:', err.message);
    if (err.data) console.error('Data:', JSON.stringify(err.data, null, 2));
  }
}

main();
