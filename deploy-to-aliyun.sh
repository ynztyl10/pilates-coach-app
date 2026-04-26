#!/bin/bash
set -e

# ============================================
# 阿里云 OSS 静态网站部署脚本
# ============================================
# 使用前请填写以下配置：

ACCESS_KEY_ID="你的AccessKey ID"
ACCESS_KEY_SECRET="你的AccessKey Secret"
REGION="cn-hangzhou"           # 地域，如 cn-hangzhou, cn-beijing 等
BUCKET_NAME="pilates-handbook" # OSS Bucket 名称（全局唯一）
DOMAIN="gundam3d.cn"           # 已备案域名

# ============================================

ALIYUN_CLI="$HOME/.qoderwork/aliyun"
DIST_DIR="./dist"

if [ ! -d "$DIST_DIR" ]; then
    echo "错误: $DIST_DIR 目录不存在，请先运行 npm run build"
    exit 1
fi

echo "配置阿里云 CLI..."
$ALIYUN_CLI configure set --profile default \
    --access-key-id "$ACCESS_KEY_ID" \
    --access-key-secret "$ACCESS_KEY_SECRET" \
    --region "$REGION" \
    --language zh

echo "检查 Bucket 是否存在..."
if ! $ALIYUN_CLI oss ls | grep -q "oss://$BUCKET_NAME"; then
    echo "创建 Bucket: $BUCKET_NAME"
    $ALIYUN_CLI oss mb "oss://$BUCKET_NAME" --acl public-read
else
    echo "Bucket 已存在"
fi

echo "配置静态网站托管..."
$ALIYUN_CLI oss website "oss://$BUCKET_NAME" \
    --index index.html \
    --error 404.html

echo "设置 Bucket 为公共读..."
$ALIYUN_CLI oss acl "oss://$BUCKET_NAME" public-read

echo "上传文件到 OSS..."
$ALIYUN_CLI oss cp "$DIST_DIR/" "oss://$BUCKET_NAME/" --recursive --force

echo "配置自定义域名..."
$ALIYUN_CLI oss bucket-cname --method put "oss://$BUCKET_NAME" "$DOMAIN" 2>/dev/null || true

echo ""
echo "============================================"
echo "部署完成！"
echo "访问地址: http://$BUCKET_NAME.oss-$REGION.aliyuncs.com"
echo ""
echo "接下来请完成以下步骤绑定域名 $DOMAIN:"
echo "1. 登录阿里云控制台 -> OSS -> 你的 Bucket -> 传输管理 -> 域名管理"
echo "2. 添加域名 $DOMAIN，选择自动添加 CNAME 记录"
echo "3. 在域名解析服务商处添加 CNAME: $DOMAIN -> $BUCKET_NAME.oss-$REGION.aliyuncs.com"
echo "4. 如果需要 HTTPS，在域名管理里上传或申请 SSL 证书"
echo "============================================"
