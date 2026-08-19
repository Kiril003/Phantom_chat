import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "15mb" }));

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== "MY_GEMINI_API_KEY"),
  });
});

// 1. Multi-turn AI Copilot & Channel Assistant
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { messages, systemInstruction, enableThinking, modelType } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      // High-quality smart simulation if no key configured yet
      const lastUserMsg = Array.isArray(messages) && messages.length > 0 ? messages[messages.length - 1].content : "Привіт!";
      return res.json({
        reply: `[Aura Copilot] Я проаналізував повідомлення: "${lastUserMsg}". Готовий допомогти скоординувати зустріч, створити інтерактивне опитування, скласти досьє локації чи розбити спільний чек! ✨ (Підключіть власний GEMINI_API_KEY для повного доступу до живих моделей Gemini).`,
        thoughtProcess: enableThinking ? "Аналіз контексту: виявлено намір швидкої координації та планування дій у месенджері." : null,
      });
    }

    let modelName = "gemini-3.5-flash";
    if (modelType === "pro" || enableThinking) {
      modelName = "gemini-3.1-pro-preview";
    } else if (modelType === "lite") {
      modelName = "gemini-3.1-flash-lite";
    }

    // Format conversation history for Gemini
    const contents = (messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" || m.role === "model" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    if (contents.length === 0) {
      contents.push({ role: "user", parts: [{ text: "Привіт!" }] });
    }

    const config: any = {
      systemInstruction: systemInstruction || 
        "Ти — інтелектуальний помічник Aura в новітньому сучасному месенджері з органічним теплим дизайном. Твоя мета — допомагати користувачам спілкуватися, вирішувати повсякденні завдання, планувати зустрічі, створювати досьє локацій, робити вижимки довгих чатів, підбирати точні та лаконічні формулювання українською та іншими мовами. Будь ввічливим, чітким, конструктивним та стильним.",
    };

    if (enableThinking && modelName === "gemini-3.1-pro-preview") {
      config.thinkingConfig = { thinkingLevel: ThinkingLevel.HIGH };
    }

    const response = await ai.models.generateContent({
      model: modelName,
      contents,
      config,
    });

    res.json({
      reply: response.text || "Відповідь згенерована успішно.",
    });
  } catch (error: any) {
    console.error("Error in /api/gemini/chat:", error);
    res.status(500).json({ error: error.message || "Помилка обробки Gemini API" });
  }
});

// 2. Chat Digest & Catch-Up Summarizer
app.post("/api/gemini/summarize", async (req, res) => {
  try {
    const { messages, chatTitle } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        summary: `Короткий дайджест чату "${chatTitle || "Поточний діалог"}":
• Обговорено координацію зустрічі на Подолі біля B Fresh о 19:30.
• Узгоджено спільне замовлення та розподіл витрат на команду.
• Заплановано презентацію нового концепту інтерфейсу в п'ятницю.`,
        actionItems: [
          "Підтвердити прибуття о 19:30",
          "Перевірити рахунок у split-bill картці",
          "Переглянути спільні матеріали в медіа-галереї",
        ],
        mood: "Діловий, продуктивний, позитивний",
      });
    }

    const chatContent = (messages || [])
      .map((m: any) => `${m.senderName || m.sender}: ${m.text || m.content || ""}`)
      .join("\n");

    const prompt = `Проаналізуй наступні повідомлення з групового чату "${chatTitle || "Aura Chat"}":
${chatContent}

Створи чіткий структурований підсумок українською мовою у форматі:
1. Короткий зміст (2-3 ключові тези)
2. Зафіксовані домовленості та завдання (Action Items)
3. Загальний настрій / статус бесіди.
Будь лаконічним і корисним.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
    });

    res.json({
      summaryText: response.text || "Підсумок сформовано.",
    });
  } catch (error: any) {
    console.error("Error in /api/gemini/summarize:", error);
    res.status(500).json({ error: error.message || "Не вдалося згенерувати підсумок" });
  }
});

// 3. Tone Shifter & Message Enhancer
app.post("/api/gemini/tone-shift", async (req, res) => {
  try {
    const { text, tone } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      const toneMap: Record<string, string> = {
        polite: `Доброго дня! Хотів би уточнити: ${text}. Буду вдячний за оперативну відповідь.`,
        concise: `Суть: ${text}. Чекаю апдейт.`,
        witty: `Слухай, тут така справа: ${text} 😉 Що скажеш?`,
        executive: `Шановні колеги, щодо пункту: ${text}. Прошу синхронізувати статус.`,
      };
      return res.json({
        enhancedText: toneMap[tone] || text,
      });
    }

    const prompt = `Перепиши наступне повідомлення користувача в тоні: "${tone || "ввічливий та діловий"}" українською мовою. Збережи оригінальний зміст, але покращи стиль, пунктуацію та подачу. Поверни ТІЛЬКИ переписаний текст без лапок і вступних слів.
Оригінальний текст:
"${text}"`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
    });

    res.json({
      enhancedText: response.text?.trim() || text,
    });
  } catch (error: any) {
    console.error("Error in /api/gemini/tone-shift:", error);
    res.status(500).json({ error: error.message || "Помилка стилізації тексту" });
  }
});

// 4. AI Location Dossier Generator (Досьє локації)
app.post("/api/gemini/location-dossier", async (req, res) => {
  try {
    const { placeName, category, address, city } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        dossier: {
          title: placeName || "B Fresh",
          category: category || "Магазин · Продукти",
          address: address || "Вулиця Всеволода Змієнка (Київ)",
          vibe: "Свіжа крафтова гастрономія, затишна тераса, спешелті кава та фермерські продукти.",
          bestHours: "08:30 - 21:30 (Найменше людей о 11:00 - 15:00)",
          crowdLevel: "Помірний",
          atmosphere: ["🌿 Свіжа випічка", "☕ Спешелті кава", "📶 Швидкий Wi-Fi", "🐕 Pet-friendly"],
          transitTips: "Зручно дійти від м. Нивки або автобусом 9 по вул. Всеволода Змієнка. Є велопарковка.",
          recommendations: "Спробуйте свіжий мигдалевий круасан та сезонні органічні лимонади.",
        },
      });
    }

    const prompt = `Створи детальне, естетичне "Досьє локації" для закладу/точки:
Назва: "${placeName}"
Категорія: "${category}"
Місто/Адреса: "${city || "Київ"}, ${address}"

Надай відповідь у JSON-форматі з полями:
- vibe (короткий атмосферний опис, 1-2 речення)
- bestHours (рекомендований час відвідування)
- crowdLevel (Низький, Помірний, Високий)
- atmosphere (масив з 4 коротких тегів з емодзі, напр. "☕ Спешелті кава", "🌿 Затишний дворик")
- transitTips (як зручно дістатися, парковка, пішохідна доступність)
- recommendations (секретна порада або топ-страва/продукт).`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let parsed = {};
    try {
      parsed = JSON.parse(response.text || "{}");
    } catch {
      parsed = { vibe: response.text };
    }

    res.json({ dossier: parsed });
  } catch (error: any) {
    console.error("Error in /api/gemini/location-dossier:", error);
    res.status(500).json({ error: error.message || "Не вдалося сформувати досьє локації" });
  }
});

// 5. Smart Replies Generator
app.post("/api/gemini/smart-replies", async (req, res) => {
  try {
    const { lastMessage, senderName } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        replies: [
          "Чудово, домовились! 👍",
          "Буду через 15 хвилин 🚶",
          "Скинь координати на карті 📍",
          "Давай обговоримо в аудіо-кімнаті 🎙️",
        ],
      });
    }

    const prompt = `На основі останнього повідомлення в чаті від ${senderName || "співрозмовника"}:
"${lastMessage}"

Згенеруй 4 дуже стислі, живі та доречні варіанти швидкої відповіді українською мовою (до 5 слів кожен).
Поверни JSON масив рядків: ["відповідь 1", "відповідь 2", "відповідь 3", "відповідь 4"].`;

    const response = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let replies = [];
    try {
      replies = JSON.parse(response.text || "[]");
    } catch {
      replies = ["Так, чудово!", "Домовились 👍", "Зараз гляну", "Буду пізніше"];
    }

    res.json({ replies });
  } catch (error: any) {
    console.error("Error in /api/gemini/smart-replies:", error);
    res.status(500).json({ replies: ["Так, згоден!", "Домовились 👍", "Скоро буду"] });
  }
});

// 6. Interactive Data Table Generator
app.post("/api/gemini/generate-table", async (req, res) => {
  try {
    const { prompt, context } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        table: {
          title: "Бюджет та розподіл витрат проєкту",
          columns: [
            { key: "item", label: "Стаття / Задача", type: "text" },
            { key: "owner", label: "Відповідальний", type: "text" },
            { key: "status", label: "Статус", type: "badge" },
            { key: "amount", label: "Сума (₴)", type: "number" },
          ],
          rows: [
            { id: "r1", item: "Органічна кава та випічка", owner: "Марта", status: "Виконано", amount: 1450 },
            { id: "r2", item: "Оренда студії / коворкінгу", owner: "Тарас", status: "В процесі", amount: 3200 },
            { id: "r3", item: "Дизайн-система та брендбук", owner: "Кирило", status: "Затверджено", amount: 8500 },
            { id: "r4", item: "Транспорт та логістика", owner: "Олена", status: "Очікує", amount: 980 },
          ],
          summaryRow: { item: "Загальний підсумок", owner: "4 учасники", status: "Активний", amount: 14130 },
        },
      });
    }

    const aiPrompt = `Створи структуровану інформативну таблицю даних українською мовою на основі запиту:
"${prompt || context || "Бюджет та задачі"}"

Поверни JSON об'єкт за схемою:
{
  "title": "Назва таблиці",
  "description": "Короткий опис",
  "columns": [
    { "key": "string", "label": "string", "type": "text | number | badge | date" }
  ],
  "rows": [
    { "id": "r1", "colKey1": "value", "colKey2": 123, ... }
  ],
  "summaryRow": { "colKey1": "Підсумок", "colKey2": "...", ... } // опціонально
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: aiPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let tableData = {};
    try {
      tableData = JSON.parse(response.text || "{}");
    } catch {
      tableData = { title: "Таблиця", columns: [], rows: [] };
    }

    res.json({ table: tableData });
  } catch (error: any) {
    console.error("Error in /api/gemini/generate-table:", error);
    res.status(500).json({ error: "Помилка створення таблиці" });
  }
});

// 7. Multi-Quote Synthesizer (Синтез кількох цитат)
app.post("/api/gemini/synthesize-quotes", async (req, res) => {
  try {
    const { quotes, goal } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        synthesis: {
          title: "Синтез виділених повідомлень",
          keyPoints: [
            "Узгоджено спільний час зустрічі о 19:30.",
            "Розподілено ролі: Марта бронює столик, Тарас відповідає за десерти, Кирило координує маршрут.",
            "Підтверджено перенесення обговорення кошторису на п'ятницю.",
          ],
          conclusion: "Команда досягла згоди з усіх ключових пунктів без відкритих розбіжностей.",
          actionItem: "Внести узгоджений час у спільний календар.",
        },
      });
    }

    const quotesText = (quotes || [])
      .map((q: any, i: number) => `[Повідомлення ${i + 1}] від ${q.senderName} (${q.timestamp}): "${q.text}"`)
      .join("\n\n");

    const prompt = `Проаналізуй та синтезуй наступні обрані повідомлення з листування:
${quotesText}

Ціль аналізу: ${goal || "Підсумувати спільне рішення, розбіжності та наступні кроки"}

Поверни JSON об'єкт за схемою:
{
  "title": "Коротка влучна назва синтезу",
  "keyPoints": ["теза 1", "теза 2", "теза 3"],
  "conclusion": "Загальний висновок (1-2 речення)",
  "actionItem": "Ключова наступна дія"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let synthesis = {};
    try {
      synthesis = JSON.parse(response.text || "{}");
    } catch {
      synthesis = { title: "Синтез цитат", keyPoints: [response.text || ""] };
    }

    res.json({ synthesis });
  } catch (error: any) {
    console.error("Error in /api/gemini/synthesize-quotes:", error);
    res.status(500).json({ error: "Помилка синтезу цитат" });
  }
});

// 8. Chart Generator
app.post("/api/gemini/generate-chart", async (req, res) => {
  try {
    const { prompt } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.json({
        chart: {
          title: "Активність та внесок у проєкт (тиждень)",
          type: "bar",
          data: [
            { name: "Пн", val1: 14, val2: 8 },
            { name: "Вт", val1: 22, val2: 15 },
            { name: "Ср", val1: 35, val2: 24 },
            { name: "Чт", val1: 28, val2: 30 },
            { name: "Пт", val1: 42, val2: 38 },
            { name: "Сб", val1: 18, val2: 12 },
          ],
          keys: [
            { key: "val1", label: "Задачі", color: "#E87A42" },
            { key: "val2", label: "Коментарі", color: "#528A4B" },
          ],
        },
      });
    }

    const aiPrompt = `Згенеруй структуровані дані для побудови графіку (Recharts) за темою:
"${prompt || "Статистика активності"}"

Поверни JSON об'єкт за схемою:
{
  "title": "Назва графіка",
  "type": "bar | line | area",
  "data": [
    { "name": "Категорія 1", "val1": 10, "val2": 20 },
    { "name": "Категорія 2", "val1": 15, "val2": 25 }
  ],
  "keys": [
    { "key": "val1", "label": "Показник 1", "color": "#E87A42" },
    { "key": "val2", "label": "Показник 2", "color": "#528A4B" }
  ]
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: aiPrompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    let chartData = {};
    try {
      chartData = JSON.parse(response.text || "{}");
    } catch {
      chartData = { title: "Графік", type: "bar", data: [], keys: [] };
    }

    res.json({ chart: chartData });
  } catch (error: any) {
    console.error("Error in /api/gemini/generate-chart:", error);
    res.status(500).json({ error: "Помилка створення графіка" });
  }
});

async function startServer() {
  // Vite middleware in dev mode
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Aura Messenger server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
