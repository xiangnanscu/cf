<script setup>
import { ref, computed, onMounted } from "vue";

const { isMobile } = useWindowResize();

const values = ref({ content: "" });
const formRef = ref();
const loading = ref(false);
const textareaRef = ref();

const processedContent = computed(() => {
  const content = values.value.content;
  // 首先处理换行
  const withNewlines = content.replace(/(?<!\n)\n(?!\n)/g, "\n\n");
  // 定义英文标点到中文标点的映射
  const punctuationMap = {
    ",": "，",
    ".": "。",
    "?": "？",
    "!": "！",
    ":": "：",
    ";": "；",
    "(": "（",
    ")": "）",
    "[": "【",
    "]": "】",
    "\\": "、",
  };
  // 使用正则表达式匹配中文字符之间的英文标点
  const withChinesePunctuation = withNewlines.replace(
    /(?<=[\u4e00-\u9fa5])\s*[,.?!:;()[\]\\]\s*/g,
    (match) => {
      // 提取标点符号（去除空白字符）
      const punctuation = match.trim();
      return punctuationMap[punctuation] || punctuation;
    },
  );
  return withChinesePunctuation;
});

const fileName = computed(() => {
  const firstLine = processedContent.value.split("\n")[0];
  if (!firstLine.startsWith("#")) {
    return "";
  }
  const title = firstLine.replace(/^#\s*/, "").trim();
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}${month}${day}-${title}`;
});

function getFolderPath() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}${month}`;
}

async function handleSubmit() {
  try {
    loading.value = true;

    const formData = {
      content: processedContent.value,
    };

    const folderPath = getFolderPath();
    if (fileName.value) {
      // 有标题时，生成完整路径
      formData.path = `${folderPath}/${fileName.value}.md`;
    } else {
      // 没有标题时，只传folderPath，让后端调用Gemini API生成标题
      formData.folderPath = folderPath;
    }

    const response = await fetch("/create", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      // 提交成功后清空内容
      values.value.content = "";
      formRef.value?.resetFields();
    } else {
      throw new Error("提交失败");
    }
  } catch (error) {
    console.error("提交错误:", error);
    // 这里可以添加错误提示
  } finally {
    loading.value = false;
  }
}

function handleReset() {
  values.value.content = "";
  formRef.value?.resetFields();
}

onMounted(() => {
  // 确保textarea自动获取焦点
  if (textareaRef.value) {
    textareaRef.value.focus();
  }
});
</script>

<template>
  <div class="container">
    <a-row>
      <a-col :span="isMobile ? 24 : 12">
        <a-form ref="formRef" :model="values" layout="vertical" @finish="handleSubmit">
          <a-form-item name="content" :rules="[{ required: true, message: '请输入内容' }]">
            <a-textarea
              ref="textareaRef"
              v-model:value="values.content"
              :rows="20"
              placeholder="思绪小憩..."
              :auto-size="{ minRows: 5, maxRows: 30 }"
              :auto-focus="true"
            />
          </a-form-item>

          <a-form-item>
            <a-space :style="{ width: '100%' }" direction="vertical" :size="16">
              <a-button
                type="primary"
                html-type="submit"
                :loading="loading"
                size="large"
                :block="isMobile"
              >
                {{ loading ? "提交中..." : "提交" }}
              </a-button>
              <!-- <a-button @click="handleReset" size="large"> 重置 </a-button> -->
            </a-space>
          </a-form-item>
        </a-form>
      </a-col>
      <a-col :span="isMobile ? 24 : 12" :style="{ paddingLeft: isMobile ? '0' : '16px' }">
        <MarkdownRender :content="processedContent"></MarkdownRender>
      </a-col>
    </a-row>
  </div>
</template>

<style scoped>
.container {
  width: 100%;
  max-width: 100%;
  margin: 0 auto;
  padding: 0 16px;
}
</style>
