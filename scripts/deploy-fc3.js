const fc = require('@alicloud/fc20230330');

async function main() {
  const client = new fc.default({
    accessKeyId: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
    accessKeySecret: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    regionId: 'cn-hangzhou',
    endpoint: 'fcv3.cn-hangzhou.aliyuncs.com',
  });

  const input = new fc.CreateFunctionInput({
    functionName: 'pilates-api',
    runtime: 'nodejs20',
    handler: 'index.handler',
    code: new fc.InputCodeLocation({
      ossBucketName: 'pilates-coach-handbook',
      ossObjectName: 'deploy/backend.zip',
    }),
    memorySize: 512,
    timeout: 30,
    environmentVariables: {
      OSS_REGION: 'oss-cn-hangzhou',
      OSS_BUCKET: 'pilates-coach-handbook',
      ALIBABA_CLOUD_ACCESS_KEY_ID: process.env.ALIBABA_CLOUD_ACCESS_KEY_ID,
      ALIBABA_CLOUD_ACCESS_KEY_SECRET: process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET,
    },
  });

  const request = new fc.CreateFunctionRequest({
    body: input,
  });

  try {
    const result = await client.createFunction(request);
    console.log('Function created successfully!');
    console.log(JSON.stringify(result.body, null, 2));
  } catch (err) {
    console.error('Failed to create function:', err.message);
    if (err.data) {
      console.error('Error data:', JSON.stringify(err.data, null, 2));
    }
    process.exit(1);
  }
}

main();
