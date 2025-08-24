# 远程 Webhook 配置说明

## 概述

核稿大师服务现在支持在执行完成后向远程 URL 发送处理结果。这个功能可以用于：
- 日志记录
- 数据分析
- 第三方系统集成
- 审计追踪

## 配置方法

### 1. 环境变量配置

在 `wrangler.jsonc` 文件中设置 `REMOTE_WEBHOOK_URL` 环境变量：

```json
{
  "vars": {
    "REMOTE_WEBHOOK_URL": "https://your-webhook-endpoint.com/api/review-results"
  }
}
```

### 2. 本地开发环境

创建 `.dev.vars` 文件（本地开发使用）：

```env
REMOTE_WEBHOOK_URL=https://your-webhook-endpoint.com/api/review-results
```

### 3. 生产环境

使用 Wrangler CLI 设置生产环境变量：

```bash
wrangler secret put REMOTE_WEBHOOK_URL
```

## 发送的数据格式

每次 `pipeline.execute` 执行完成后，系统会向配置的 URL 发送 POST 请求，包含以下字段：

```json
{
  "originalText": "原始文本内容",
  "finalText": "处理后的最终文本",
  "errors": [
    {
      "plugin": "插件名称",
      "error": "错误信息",
      "stage": 1
    }
  ],
  "metadata": {
    "processingEnd": "2024-01-01T12:00:00.000Z",
    "processingStart": "2024-01-01T11:59:00.000Z",
    "summary": "处理摘要信息"
  }
}
```

## 字段说明

- **originalText**: 用户输入的原始文本
- **finalText**: 经过所有插件处理后的最终文本
- **errors**: 处理过程中的错误列表（如果成功则为空数组）
- **metadata.processingEnd**: 处理完成的时间戳
- **metadata.processingStart**: 处理开始的时间戳
- **metadata.summary**: 处理摘要，包含所有插件的处理记录

## 错误处理

- 如果远程 URL 不可用，不会影响主要的核稿服务
- 所有 webhook 调用都是异步的，不会阻塞用户响应
- 失败的重试和错误日志会记录在 Cloudflare Worker 的控制台中

## 安全注意事项

- 确保远程 webhook URL 使用 HTTPS
- 考虑在远程端点添加身份验证
- 敏感信息（如 API 密钥）不要包含在发送的数据中

## 示例实现

### Node.js 接收端点示例

```javascript
app.post('/api/review-results', (req, res) => {
  const { originalText, finalText, errors, metadata } = req.body;

  console.log('收到核稿结果:', {
    originalLength: originalText.length,
    finalLength: finalText.length,
    hasErrors: errors.length > 0,
    processingTime: new Date(metadata.processingEnd) - new Date(metadata.processingStart)
  });

  // 处理数据...

  res.status(200).json({ success: true });
});
```

### Python Flask 接收端点示例

```python
from flask import Flask, request, jsonify
from datetime import datetime

app = Flask(__name__)

@app.route('/api/review-results', methods=['POST'])
def receive_review_results():
    data = request.json

    # 记录处理结果
    print(f"收到核稿结果: {datetime.now()}")
    print(f"原始文本长度: {len(data['originalText'])}")
    print(f"最终文本长度: {len(data['finalText'])}")
    print(f"错误数量: {len(data['errors'])}")

    return jsonify({"success": True})
```
