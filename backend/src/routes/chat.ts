import { Router, Request, Response } from 'express';

const router = Router();

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen3-235b-a22b-2507';

const SYSTEM_PROMPT = `You are the Umbrella Tunisie project assistant — an AI helping users understand land degradation, desertification, and the LDN (Land Degradation Neutrality) project in Tunisia.

CONTEXT:
- OSS (Observatory of the Sahara and the Sahel) — coordination and technical support
- GEF/FEM — principal funder
- UNEP/PNUE — executing agency
- Tunisian Ministry of Environment — national focal point
- Phase IV (Consolidation & Sustainability), targeting NDT by 2030
- 75% of Tunisia's territory is threatened by desertification
- SDG 15.3.1 indicator: proportion of degraded land vs total
- National institutions: CNLCD, DGACTA, DGF, CNCT, INM, INS, ANPE, IRA

NDT PRINCIPLES: Éviter (prevent), Réduire (minimize), Inverser (restore)
CNV: restore 2.2 million hectares by 2030, tracked via land cover change, land productivity dynamics, soil organic carbon

KEY DATA — Couverture terrestre:
- 2001-2015: 0.47% degraded, 97.44% stable, 2.09% improved; prairies lost 3155 km² to cultivation
- 2016-2019: 0.11% degraded, 99.15% stable, 0.74% improved; mostly stable

KEY DATA — Productivité des terres:
- 2001-2015: 7.34% degraded, 78.62% stable, 13.40% improved
- 2016-2019: 0.25% degraded, 87.33% stable, 11.70% improved

KEY DATA — Carbone organique du sol (SOC):
- 2001-2015: 1.62% degraded, 98.07% stable, 0.25% improved; prairies -28%
- 2016-2019: 0.70% degraded, 98.72% stable, 0.52% improved; near-neutral balance

STRATEGIES: PAN-LCD, Biodiversité, Forêts & parcours, CES, Économie Verte, Plan sécheresse, CDN, Eau 2050, NAMAs, Transition écologique

PRAIS: 7 strategic objectives covering ecosystems, populations, drought, environmental benefits, resource mobilization, voluntary targets, and implementation framework

GEOPORTAL: WMS layers — Land Cover (OSS & ESA CCI), Land Cover Change, Land Productivity (JRC, FAO, OSS), Soil Organic Carbon, SDG 15.3.1, Precipitation Index (SPI)

NAVIGATION: / (home), /ndt-en-tunisie, /geoportail, /apercu, /tableau-de-bord (aperçu), /tableau-de-bord-ndt (dashboard), /acquis-et-success-stories, /ressources
APP URL: https://umbrella-tun.oss-online.org/

RULES:
- Answer ONLY based on the project context provided above or documents you have access to.
- If you don't have reliable data on a question, say: "I don't have reliable data on this topic. Please consult official project documents or visit the Geoportal for spatial data."
- Never fabricate statistics, partner names, or project details.
- Respond in the same language the user writes in (French, English, Arabic, etc.).
- Be concise and helpful. Guide users to relevant pages when appropriate.
- You are not a general-purpose assistant. Stay within the domain of the Umbrella Tunisie project, land degradation, desertification, and related environmental topics in Tunisia and the Sahel region.`;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * POST /api/chat
 * Streaming proxy to OpenRouter.
 * Body: { messages: ChatMessage[] }
 */
router.post('/', async (req: Request, res: Response): Promise<void> => {
  const requestTime = Date.now();
  console.log(`\n[CHAT] === New request at ${new Date().toISOString()} ===`);
  console.log(`[CHAT] API key configured: ${!!OPENROUTER_API_KEY}`);
  console.log(`[CHAT] Model: ${MODEL}`);

  if (!OPENROUTER_API_KEY) {
    console.error('[CHAT] ERROR: No API key');
    res.status(500).json({ error: 'OpenRouter API key not configured on the server.' });
    return;
  }

  const { messages } = req.body as { messages?: ChatMessage[] };

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    console.error('[CHAT] ERROR: No messages provided');
    res.status(400).json({ error: 'Messages array is required.' });
    return;
  }

  console.log(`[CHAT] Messages count: ${messages.length}`);
  console.log(`[CHAT] Last user message: "${messages[messages.length - 1]?.content?.slice(0, 80)}..."`);

  // Prepend system prompt
  const fullMessages: ChatMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    ...messages,
  ];

  try {
    console.log('[CHAT] Sending request to OpenRouter...');
    const openrouterStart = Date.now();

    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://umbrella-tunisie.org',
        'X-Title': 'Umbrella Tunisie',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: fullMessages,
        stream: true,
      }),
    });

    console.log(`[CHAT] OpenRouter responded: ${response.status} in ${Date.now() - openrouterStart}ms`);

    if (!response.ok) {
      const errBody = await response.text();
      console.error(`[CHAT] OpenRouter error (${response.status}):`, errBody);
      res.status(response.status).json({ error: `OpenRouter error: ${response.status}` });
      return;
    }

    // Stream SSE back to client
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    const reader = response.body?.getReader();
    if (!reader) {
      console.error('[CHAT] ERROR: No reader from OpenRouter response');
      res.status(500).json({ error: 'Failed to read OpenRouter response stream.' });
      return;
    }

    const decoder = new TextDecoder();
    let chunkCount = 0;
    let contentChunks = 0;

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          console.log(`[CHAT] Stream ended. Total raw chunks: ${chunkCount}, content chunks: ${contentChunks}, total time: ${Date.now() - requestTime}ms`);
          break;
        }

        chunkCount++;
        const chunk = decoder.decode(value, { stream: true });

        if (chunkCount <= 3) {
          console.log(`[CHAT] Raw chunk #${chunkCount} (${value.byteLength} bytes):`, chunk.slice(0, 200));
        }

        // Parse SSE lines from OpenRouter
        const lines = chunk.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed === 'data: [DONE]') continue;
          if (!trimmed.startsWith('data: ')) continue;

          const jsonStr = trimmed.slice(6); // Remove "data: " prefix
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              contentChunks++;
              if (contentChunks <= 5) {
                console.log(`[CHAT] Content chunk #${contentChunks}: "${content.slice(0, 50)}"`);
              }
              res.write(`data: ${JSON.stringify({ content })}\n\n`);
            }
          } catch {
            // Skip malformed JSON chunks
          }
        }
      }

      console.log(`[CHAT] Sending [DONE] to client. Total content chunks sent: ${contentChunks}`);
      res.write('data: [DONE]\n\n');
      res.end();
    } catch (streamErr) {
      console.error('[CHAT] Stream read error:', streamErr);
      res.write(`data: ${JSON.stringify({ error: 'Stream interrupted' })}\n\n`);
      res.end();
    }
  } catch (error) {
    console.error('[CHAT] Route error:', error);
    res.status(500).json({ error: 'Failed to connect to AI service.' });
  }
});

export default router;
