<script setup lang="js">
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js/lib/core'
import 'highlight.js/styles/github.css'
import javascript from 'highlight.js/lib/languages/javascript'
import lua from 'highlight.js/lib/languages/lua'
import sql from 'highlight.js/lib/languages/sql'
import bash from 'highlight.js/lib/languages/bash'

hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('lua', lua)
hljs.registerLanguage('sql', sql)
hljs.registerLanguage('bash', bash)

const props = defineProps({
  content: String
})
const Markdown = new MarkdownIt({
  highlight(str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        const code = hljs.highlight(str, { language: lang, ignoreIllegals: true }).value
        return code // `<pre class="hljs"><code>${code}</code></pre>`
      } catch (error) {
        console.error(error)
      }
    }
    return '<pre class="hljs"><code>' + Markdown.utils.escapeHtml(str) + '</code></pre>'
  }
})
const content = computed(()=>Markdown.render(props.content))
</script>

<template>
  <div v-html="content"></div>
</template>

<style></style>
