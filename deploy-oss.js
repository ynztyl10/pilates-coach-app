const OSS = require('ali-oss');
const fs = require('fs');
const path = require('path');

const accessKeyId = process.env.ALI_ACCESS_KEY_ID;
const accessKeySecret = process.env.ALI_ACCESS_KEY_SECRET;
const region = 'oss-cn-hangzhou';
const bucket = 'pilates-coach-handbook';
const distDir = path.resolve(__dirname, 'dist');

const client = new OSS({
  region,
  accessKeyId,
  accessKeySecret,
  bucket,
  secure: true,
});

async function ensureBucket() {
  try {
    console.log(`Creating bucket ${bucket}...`);
    await client.putBucket(bucket, { Timeout: 60000 });
    console.log(`Bucket ${bucket} created.`);
  } catch (e) {
    if (e.code === 'BucketAlreadyExists') {
      console.log(`Bucket ${bucket} already exists.`);
    } else {
      throw e;
    }
  }

  try {
    await client.putBucketACL(bucket, 'public-read');
    console.log('Bucket ACL set to public-read.');
  } catch (e) {
    console.log('Note: Could not set bucket ACL via API (may need console config). Continuing...');
  }
}

async function configureStaticWebsite() {
  console.log('Configuring static website hosting...');
  await client.putBucketWebsite(bucket, {
    index: 'index.html',
    error: 'index.html',
  });
  console.log('Static website hosting configured (index.html, 404 -> index.html for SPA).');
}

function listFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    if (item.isDirectory()) {
      files.push(...listFiles(fullPath));
    } else {
      files.push(fullPath);
    }
  }
  return files;
}

async function uploadFiles() {
  const files = listFiles(distDir);
  console.log(`Found ${files.length} files to upload.`);

  for (const filePath of files) {
    const relativePath = path.relative(distDir, filePath);
    const content = fs.readFileSync(filePath);
    const ext = path.extname(filePath);
    let contentType = 'application/octet-stream';
    if (ext === '.html') contentType = 'text/html';
    else if (ext === '.js') contentType = 'application/javascript';
    else if (ext === '.css') contentType = 'text/css';
    else if (ext === '.json') contentType = 'application/json';
    else if (ext === '.svg') contentType = 'image/svg+xml';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    await client.put(relativePath, content, {
      headers: { 'Content-Type': contentType },
    });
    console.log(`Uploaded: ${relativePath}`);
  }
}

async function main() {
  try {
    await ensureBucket();
    await configureStaticWebsite();
    await uploadFiles();
    console.log('\nDeployment complete!');
    console.log(`Website URL: http://${bucket}.oss-${region}.aliyuncs.com/index.html`);
    console.log(`HTTPS URL: https://${bucket}.oss-${region}.aliyuncs.com/index.html`);
  } catch (e) {
    console.error('Deployment failed:', e.message);
    if (e.code) console.error('Error code:', e.code);
    process.exit(1);
  }
}

main();
