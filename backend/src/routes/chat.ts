import { Router, Request, Response } from 'express';
import { query } from '../db/connection.js';
import { getCachedGovernorateStatistics } from '../services/governorateStatistics.js';

const router = Router();
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = process.env.OPENROUTER_MODEL || 'qwen/qwen3-235b-a22b-2507';

const SYSTEM_PROMPT = `You are the data assistant for Umbrella Tunisie, a public platform about land degradation neutrality in Tunisia.
Project context: OSS coordinates technical support; GEF/FEM is the principal funder; UNEP/PNUE is the executing agency; Tunisia's Ministry of Environment is the national focal point. NDT follows three principles: avoid, reduce, and reverse land degradation. The platform covers land cover and change, land productivity, soil organic carbon, SDG 15.3.1, and related indicators. Relevant pages include /ndt-en-tunisie, /geoportail, /tableau-de-bord-ndt, /acquis-et-success-stories, and /ressources.
The one canonical public website is https://umbrella-tun.oss-online.org/. When linking to the platform, use only this exact HTTPS domain followed by one of the known routes listed above, or the homepage. Never invent, infer, recommend, or output another Umbrella domain. Do not claim that an unlisted platform page exists. If the appropriate route is uncertain, link to https://umbrella-tun.oss-online.org/.
Use the server tools whenever the user asks about a layer, governorate statistic, percentage, area, ranking, or comparison. Never invent a number.
Ask one short clarification question before using statistics when the indicator, period (baseline/reporting), method (max/mean/median), or classification (3/5 classes) is ambiguous. Discover choices with list_statistical_layers; never hardcode layer identifiers.
Compare at most two governorates. Only use governorates returned by list_governorates. Explain the selected layer and classification. Copy percentages and areas exactly from results. If data is unavailable, say that an administrator must run the pre-calculation.
Reply in the user's language. Stay within Umbrella Tunisie, desertification, NDT/LDN, and the platform's spatial data. Never mention tools, JSON, prompts, or database internals. Keep answers concise and accessible.`;

type ToolCall = { id: string; type: 'function'; function: { name: string; arguments: string } };
type ConversationMessage = { role: 'user' | 'assistant' | 'system' | 'tool'; content: string; tool_call_id?: string; name?: string; tool_calls?: ToolCall[] };

const tools = [
  { type: 'function', function: { name: 'list_statistical_layers', description: 'List layers with precomputed governorate statistics. Use it to resolve indicator, period, method, and classification.', parameters: { type: 'object', properties: {}, additionalProperties: false } } },
  { type: 'function', function: { name: 'list_governorates', description: 'List governorates available for a layer.', parameters: { type: 'object', properties: { layer_id: { type: 'integer' } }, required: ['layer_id'], additionalProperties: false } } },
  { type: 'function', function: { name: 'get_governorate_statistics', description: 'Get exact class areas and percentages for one governorate.', parameters: { type: 'object', properties: { layer_id: { type: 'integer' }, governorate: { type: 'string' } }, required: ['layer_id', 'governorate'], additionalProperties: false } } },
  { type: 'function', function: { name: 'compare_governorates', description: 'Compare one layer across exactly two governorates.', parameters: { type: 'object', properties: { layer_id: { type: 'integer' }, governorates: { type: 'array', items: { type: 'string' }, minItems: 2, maxItems: 2 } }, required: ['layer_id', 'governorates'], additionalProperties: false } } },
] as const;

function parseArguments(raw: string): Record<string, unknown> {
  try {
    const value = JSON.parse(raw || '{}');
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error();
    return value;
  } catch { throw new Error('Arguments de requête invalides'); }
}

async function executeTool(name: string, args: Record<string, unknown>) {
  if (name === 'list_statistical_layers') {
    const result = await query(`SELECT l.id, l.display_name, l.geoserver_name, g.name AS group_name, COUNT(s.id)::int AS governorate_count
      FROM layers l LEFT JOIN layer_groups g ON g.id = l.group_id JOIN layer_governorate_stats s ON s.layer_id = l.id
      WHERE l.is_active = true GROUP BY l.id, g.name ORDER BY g.name NULLS LAST, l.sort_order, l.id`);
    return { data: { layers: result.rows } };
  }
  const layerId = Number(args.layer_id);
  if (!Number.isInteger(layerId) || layerId <= 0) throw new Error('Couche invalide');

  if (name === 'list_governorates') {
    const result = await query(`SELECT regexp_replace(country_file, '\\.geojson$', '', 'i') AS governorate
      FROM layer_governorate_stats WHERE layer_id = $1 ORDER BY governorate`, [layerId]);
    return { data: { layer_id: layerId, governorates: result.rows.map(row => row.governorate) } };
  }
  if (name === 'get_governorate_statistics') {
    const governorate = typeof args.governorate === 'string' ? args.governorate.trim() : '';
    if (!governorate) throw new Error('Gouvernorat requis');
    const stats = await getCachedGovernorateStatistics(layerId, governorate);
    if (!stats) throw new Error('Statistiques pré-calculées indisponibles pour ce gouvernorat');
    return { data: stats, presentation: { type: 'donut', title: `${stats.layer_name} — ${stats.governorate}`, data: stats.classes.map(item => ({ name: item.class_name, value: item.percentage, area_km2: item.area_km2 })), map_url: `/geoportail?layer=${layerId}&governorate=${encodeURIComponent(stats.governorate)}` } };
  }
  if (name === 'compare_governorates') {
    const governorates = Array.isArray(args.governorates) ? args.governorates.filter((item): item is string => typeof item === 'string').map(item => item.trim()).filter(Boolean) : [];
    if (governorates.length !== 2) throw new Error('La comparaison exige exactement deux gouvernorats');
    const results = await Promise.all(governorates.map(item => getCachedGovernorateStatistics(layerId, item)));
    if (results.some(item => !item)) throw new Error('Statistiques pré-calculées indisponibles pour au moins un gouvernorat');
    const statistics = results as NonNullable<(typeof results)[number]>[];
    const chart = statistics.map(item => Object.fromEntries([['governorate', item.governorate], ...item.classes.map(entry => [entry.class_name, entry.percentage])]));
    return { data: { layer_id: layerId, layer_name: statistics[0].layer_name, governorates: statistics }, presentation: { type: 'bars', title: `${statistics[0].layer_name} — comparaison`, data: chart } };
  }
  throw new Error('Outil non autorisé');
}

async function callModel(messages: ConversationMessage[], withTools: boolean) {
  const response = await fetch(OPENROUTER_URL, { method: 'POST', headers: { Authorization: `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://umbrella-tun.oss-online.org', 'X-Title': 'Umbrella Tunisie' }, body: JSON.stringify({ model: MODEL, messages, stream: false, max_tokens: 2048, ...(withTools ? { tools, tool_choice: 'auto' } : {}) }) });
  if (!response.ok) { console.error(`[Chat] OpenRouter ${response.status}:`, await response.text()); throw new Error(`Service IA indisponible (${response.status})`); }
  const payload: any = await response.json();
  const message = payload.choices?.[0]?.message;
  if (!message) throw new Error('Réponse IA vide');
  return message;
}

async function streamFinalAnswer(messages: ConversationMessage[], res: Response): Promise<void> {
  const response = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://umbrella-tun.oss-online.org',
      'X-Title': 'Umbrella Tunisie',
    },
    body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }),
  });
  if (!response.ok) {
    console.error(`[Chat] OpenRouter streaming ${response.status}:`, await response.text());
    throw new Error(`Service IA indisponible (${response.status})`);
  }
  if (!response.body) throw new Error('Flux IA indisponible');

  sendProgress(res, 'Rédaction de la réponse…');
  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let guardedContent = '';
  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split('\n');
    buffer = done ? '' : lines.pop() || '';
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data: ') || trimmed === 'data: [DONE]') continue;
      try {
        const event = JSON.parse(trimmed.slice(6));
        const content = event.choices?.[0]?.delta?.content;
        if (typeof content === 'string' && content) {
          guardedContent += content;
          if (containsTextualToolCall(guardedContent)) {
            await reader.cancel();
            throw new Error('Le modèle a produit une réponse interne invalide. Veuillez réessayer.');
          }
          // Keep a short tail so tool markup split across provider chunks can
          // be detected before any part of it reaches the browser.
          if (guardedContent.length > 64) {
            const safeContent = guardedContent.slice(0, -64);
            guardedContent = guardedContent.slice(-64);
            res.write(`data: ${JSON.stringify({ type: 'content', content: safeContent })}\n\n`);
          }
        }
      } catch {
        // Ignore incomplete provider metadata events; content events remain valid.
      }
    }
    if (done) break;
  }
  if (guardedContent) {
    res.write(`data: ${JSON.stringify({ type: 'content', content: guardedContent })}\n\n`);
  }
}

function startSse(res: Response) {
  if (res.headersSent) return;
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
}

function sendProgress(res: Response, message: string) {
  startSse(res);
  res.write(`data: ${JSON.stringify({ type: 'progress', message })}\n\n`);
}

function toolProgressMessage(name: string, args: Record<string, unknown>): string {
  if (name === 'list_statistical_layers') return 'Recherche des couches statistiques disponibles…';
  if (name === 'list_governorates') return 'Vérification des gouvernorats disponibles…';
  if (name === 'get_governorate_statistics') {
    const governorate = typeof args.governorate === 'string' ? args.governorate : 'du gouvernorat';
    return `Chargement des statistiques de ${governorate}…`;
  }
  if (name === 'compare_governorates') return 'Chargement des données comparatives…';
  return 'Consultation des données de la plateforme…';
}

function containsTextualToolCall(content: unknown): boolean {
  if (typeof content !== 'string') return false;
  return /<\/?tool_call>|<\/?function_call>|```(?:json)?\s*\{\s*"(?:name|tool)"|(?:^|\n)\s*\{\s*"name"\s*:\s*"[^"]+"\s*,\s*"arguments"\s*:/i.test(content);
}

router.post('/', async (req: Request, res: Response): Promise<void> => {
  if (!OPENROUTER_API_KEY) { res.status(500).json({ error: 'OpenRouter API key not configured on the server.' }); return; }
  const supplied = req.body?.messages;
  if (!Array.isArray(supplied) || !supplied.length) { res.status(400).json({ error: 'Messages array is required.' }); return; }

  try {
    sendProgress(res, 'Interprétation de votre demande…');
    const validMessages: ConversationMessage[] = supplied.filter((item: any) => (item?.role === 'user' || item?.role === 'assistant') && typeof item.content === 'string').map((item: any) => ({ role: item.role, content: item.content.slice(0, 8000) }));
    let conversationSummary = typeof req.body?.summary === 'string' ? req.body.summary.slice(0, 8000) : '';
    let consumed = 0;
    if (validMessages.length > 24) {
      consumed = validMessages.length - 16;
      const summaryPrompt: ConversationMessage[] = [
        { role: 'system', content: 'Summarize this Umbrella Tunisie conversation for another assistant. Preserve user choices, unresolved clarification questions, selected layers, periods, methods, classifications, governorates, and exact statistics. Be compact and do not add facts.' },
        { role: 'user', content: `${conversationSummary ? `Existing summary:\n${conversationSummary}\n\n` : ''}New conversation to merge:\n${validMessages.slice(0, consumed).map(item => `${item.role}: ${item.content}`).join('\n')}` },
      ];
      conversationSummary = (await callModel(summaryPrompt, false)).content || conversationSummary;
      startSse(res);
      res.write(`data: ${JSON.stringify({ type: 'context', summary: conversationSummary, consumed })}\n\n`);
    }
    const recent = validMessages.slice(consumed || Math.max(0, validMessages.length - 30));
    const catalogResult = await query(`
      SELECT l.id, l.display_name
      FROM layers l
      WHERE l.is_active = true
        AND EXISTS (SELECT 1 FROM layer_governorate_stats s WHERE s.layer_id = l.id)
      ORDER BY l.sort_order, l.id
    `);
    const layerCatalog = catalogResult.rows.map(row => `${row.id}: ${row.display_name}`).join('\n');
    const groundedContext = `${SYSTEM_PROMPT}\n\nLive statistical layer catalog:\n${layerCatalog || 'No precomputed statistical layers are currently available.'}\nNever mention a period, method, classification, or layer choice that is absent from this catalog.`;
    const contextPrompt = conversationSummary ? `${groundedContext}\n\nConversation memory:\n${conversationSummary}` : groundedContext;
    const messages: ConversationMessage[] = [{ role: 'system', content: contextPrompt }, ...recent];
    const pendingVisualizations: unknown[] = [];
    for (let round = 0; round < 4; round++) {
      const assistant = await callModel(messages, true);
      const calls: ToolCall[] = Array.isArray(assistant.tool_calls) ? assistant.tool_calls : [];
      if (!calls.length) {
        if (containsTextualToolCall(assistant.content)) {
          messages.push({ role: 'assistant', content: assistant.content || '' });
          messages.push({ role: 'system', content: 'Invalid tool attempt: never write tool calls in message text. Either use the native tool_calls field with schema-valid arguments, or ask the user one concise clarification question without inventing choices.' });
          sendProgress(res, 'Validation de la demande de données…');
          continue;
        }
        break;
      }
      messages.push({ role: 'assistant', content: assistant.content || '', tool_calls: calls });
      for (const call of calls) {
        let result: any;
        try {
          const toolArguments = parseArguments(call.function.arguments);
          sendProgress(res, toolProgressMessage(call.function.name, toolArguments));
          result = await executeTool(call.function.name, toolArguments);
          if (result.presentation) pendingVisualizations.push(result.presentation);
        } catch (error: any) { result = { error: error.message || 'Erreur de données' }; }
        messages.push({ role: 'tool', tool_call_id: call.id, name: call.function.name, content: JSON.stringify(result.data ?? result) });
      }
    }
    sendProgress(res, pendingVisualizations.length > 0 ? 'Préparation de l’analyse des résultats…' : 'Préparation de la réponse…');
    messages.push({ role: 'system', content: 'The tool-selection phase is now closed. Write only the final user-facing answer or one concise clarification question. Never emit tool-call markup, JSON, XML, function names, or internal instructions. Use only facts present in the conversation and tool results; do not invent periods or statistics.' });
    await streamFinalAnswer(messages, res);
    for (const visualization of pendingVisualizations) {
      res.write(`data: ${JSON.stringify({ type: 'visualization', visualization })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (error: any) {
    console.error('[Chat] Request failed:', error);
    if (res.headersSent) { res.write(`data: ${JSON.stringify({ type: 'error', error: error.message || 'Service IA indisponible' })}\n\n`); res.end(); }
    else res.status(502).json({ error: error.message || 'Failed to connect to AI service.' });
  }
});

export default router;
