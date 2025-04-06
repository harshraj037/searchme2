// pages/api/search.js

import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET']);
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { query } = req.query;

  if (!query) {
    res.status(400).json({ error: 'Missing query parameter' });
    return;
  }

  try {
    const rnd_key = uuidv4();
    const sid = await isq(query, rnd_key);
    const result = await runQuery(query, sid);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error during search:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

async function isq(query, rnd_key) {
  const url = 'https://explorer.globe.engineer/search/__data.json____';

  const params = new URLSearchParams({
    qd: `[{"searchbox_query":"${query}","search_id":"${rnd_key}","index":0,"type":"initial_searchbox","clicked_category":null,"staged_image":null,"location":null}]`,
    sid: rnd_key,
    'x-sveltekit-invalidated': '01',
  });

  const headers = {
    'sec-ch-ua-platform': '"Android"',
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/____130.0.0.0____ Mobile Safari/537.36',
    'sec-ch-ua':
      '"Chromium";v="130", "Google Chrome";v="130", "Not?A_Brand";v="99"',
    'sec-ch-ua-mobile': '?1',
    Accept: '*/*',
    Referer: '____https://explorer.globe.engineer/____',
  };

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`isq request failed: ${response.statusText}`);
  }

  const data = await response.json();

  // Ensure the path exists
  if (!data.nodes || !data.nodes[1] || !data.nodes[1].data || !data.nodes[1].data[2]) {
    throw new Error('Unexpected response structure from isq');
  }

  const sid = data.nodes[1].data[2];
  return sid;
}

async function runQuery(query, sid) {
  const url = 'https://explorer-search.fly.dev/submitSearch';

  const params = new URLSearchParams({
    queryData: `[{"searchbox_query":"${query}","search_id":"${sid}","index":0,"type":"initial_searchbox","clicked_category":null,"staged_image":null,"location":null}]`,
    userid_auth: 'undefined',
    userid_local: 'user_1731353625970_vp09l32rl',
    model: 'default',
    search_id: sid,
  });

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/____130.0.0.0____ Mobile Safari/537.36',
    Accept: 'text/event-stream',
    Referer: '____https://explorer.globe.engineer/____',
  };

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'GET',
    headers,
  });

  if (!response.ok) {
    throw new Error(`runQuery request failed: ${response.statusText}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let doneReading = false;
  let result = {
    Summary: '',
    Details: [],
  };
  let summaryParts = [];

  while (!doneReading) {
    const { value, done } = await reader.read();
    doneReading = done;
    if (value) {
      const chunk = decoder.decode(value, { stream: true });
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'top_answer_chunk') {
              summaryParts.push(data.data);
            } else if (data.type === 'line' && data.data.isLeaf) {
              result.Details.push({ Detail: data.data.line });
            } else if (data.type === 'image') {
              const imageInfo = {
                'Images related to': data.data.images?.[0]?.imageSearchQuery || 'Not Found',
                Images: data.data.images?.map((img) => ({
                  'Image URL': img.imageUrl,
                  Link: img.link,
                })) || [],
              };
              result.Details.push(imageInfo);
            }
          } catch (err) {
            console.error('Error parsing line:', err);
          }
        }
      }
    }
  }

  result.Summary = summaryParts.join(' ').trim();
  return result;
}
