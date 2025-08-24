import { PluginPipeline } from "../lib/plugins/pipeline.mjs";
import { GrammarCheckPlugin } from "../lib/plugins/grammar/grammar-check.mjs";
import { PersonnelCheckPlugin } from "../lib/plugins/personnel/personnel-check.mjs";
import { ModelManager } from "../lib/plugins/model-manager.mjs";

/**
 * 插件管理API
 * 提供插件信息查询、配置管理等功能
 */
export default async function handler(request, env) {
  const url = new URL(request.url);
  const searchParams = url.searchParams;
  const action = searchParams.get("action");

  console.log("Plugins handler - URL:", url.toString(), "Action:", action);

  // 处理不同的API功能
  if (action === "models") {
    return handleListModels(request, env);
  } else if (action === "test") {
    return handleTestPlugin(request, env);
  } else {
    // 默认返回插件列表
    return handleListPlugins(request, env);
  }
}

/**
 * 获取可用插件列表
 */
async function handleListPlugins(request, env) {
  try {
    const plugins = [
      {
        type: "grammar",
        name: "语法检查插件",
        description: "检查文本中的语法错误、用词不当、表达不清等问题",
        version: "1.0.0",
        supportedModels: ["gemini", "deepseek"],
        configOptions: {
          modelName: {
            type: "select",
            options: ["gemini", "deepseek"],
            default: "gemini",
          },
          temperature: {
            type: "number",
            min: 0,
            max: 1,
            default: 0.3,
          },
        },
      },
      {
        type: "personnel",
        name: "人员信息核对插件",
        description: "核对文本中的人员姓名和职务信息是否正确",
        version: "1.0.0",
        supportedModels: ["gemini", "deepseek"],
        configOptions: {
          modelName: {
            type: "select",
            options: ["gemini", "deepseek"],
            default: "gemini",
          },
          personnelApiUrl: {
            type: "string",
            required: false,
            description: "人员数据API地址",
          },
          useLocalPersonnel: {
            type: "boolean",
            default: false,
            description: "使用本地人员名单",
          },
          localPersonnelData: {
            type: "textarea",
            description: "本地人员名单（每行一个，格式：姓名 职务）",
            dependsOn: "useLocalPersonnel",
          },
          cacheExpiry: {
            type: "number",
            default: 1800000,
            description: "缓存过期时间（毫秒）",
          },
        },
      },
    ];

    return new Response(
      JSON.stringify({
        success: true,
        data: plugins,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Failed to list plugins:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * 获取可用AI模型列表
 */
async function handleListModels(request, env) {
  try {
    const modelManager = new ModelManager();

    // 设置API密钥
    if (env.DEEPSEEK_API_KEY) {
      modelManager.setApiKey("deepseek", env.DEEPSEEK_API_KEY);
    }
    if (env.GEMINI_API_KEY) {
      modelManager.setApiKey("gemini", env.GEMINI_API_KEY);
    }

    const models = modelManager.getAvailableModels();

    return new Response(
      JSON.stringify({
        success: true,
        data: models,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Failed to list models:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

/**
 * 测试插件功能
 */
async function handleTestPlugin(request, env) {
  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const body = await request.json();
    const { pluginType, testText, config = {} } = body;

    if (!pluginType || !testText) {
      return new Response(
        JSON.stringify({
          error: "pluginType and testText are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 创建测试插件
    let plugin;
    const modelName = config.modelName || "gemini";
    const apiKey = modelName === "gemini" ? env.GEMINI_API_KEY : env.DEEPSEEK_API_KEY;

    switch (pluginType) {
      case "grammar":
        plugin = new GrammarCheckPlugin({
          ...config,
          modelName,
          apiKey,
        });
        break;

      case "personnel":
        plugin = new PersonnelCheckPlugin({
          ...config,
          modelName,
          apiKey,
          personnelApiUrl: config.personnelApiUrl || env.PERSONNEL_API_URL,
          useLocalPersonnel: config.useLocalPersonnel || false,
          localPersonnelData: config.localPersonnelData || "",
          parsedPersonnelData: config.parsedPersonnelData || null,
        });
        break;

      default:
        return new Response(
          JSON.stringify({
            error: `Unknown plugin type: ${pluginType}`,
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
    }

    // 执行插件测试
    const result = await plugin.process({
      text: testText,
      context: { isTest: true },
      metadata: { testMode: true },
    });

    return new Response(
      JSON.stringify({
        success: true,
        data: {
          plugin: plugin.getInfo(),
          result,
        },
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch (error) {
    console.error("Plugin test failed:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  }
}
