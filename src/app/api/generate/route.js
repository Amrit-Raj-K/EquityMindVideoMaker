import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as googleTTS from 'google-tts-api';
import ffmpeg from 'fluent-ffmpeg';
import ffmpegStatic from 'ffmpeg-static';
import fs from 'fs';
import path from 'path';
import https from 'https';
import { GoogleGenerativeAI } from "@google/generative-ai";

// Set ffmpeg path
const getFFmpegPath = () => {
    if (ffmpegStatic && fs.existsSync(ffmpegStatic)) return ffmpegStatic;
    const localPath = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', 'ffmpeg.exe');
    if (fs.existsSync(localPath)) return localPath;
    return 'ffmpeg';
};

ffmpeg.setFfmpegPath(getFFmpegPath());

const parser = new Parser();

async function downloadFile(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Failed to download audio: ${response.statusCode}`));
                return;
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

// Improved Word Wrap for vertical mobile screens (1080x1920)
function wrapText(text, maxChars = 18) {
    if (!text) return [''];
    // Remove unwanted characters that might break the line or look ugly
    const cleanText = text.replace(/[^a-zA-Z0-9\s.,?!%]/g, '');
    const words = cleanText.split(/\s+/);
    const lines = [];
    let currentLine = '';

    words.forEach(word => {
        if ((currentLine + word).length > maxChars) {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    });
    lines.push(currentLine.trim());
    return lines.filter(l => l.length > 0).slice(0, 4); // Max 4 lines
}

function cleanHeadline(title) {
    if (!title) return '';
    let cleaned = title.split(' - ')[0]; // Strip source
    cleaned = cleaned.replace(/\|.*$/, '');
    cleaned = cleaned.replace(/[^\x20-\x7E]/g, '');
    return cleaned.trim();
}

async function useGemini(apiKey, headlines, query) {
    if (!apiKey) return null;
    try {
        const genAI = new GoogleGenerativeAI(apiKey);
        // Note: Using 1.5-flash as the standard stable version. 
        // 2.5 is not currently available in public docs, but we keep the variable for user customization.
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `You are a financial news specialist. Refine these headlines for "${query}":
        ${headlines.join('\n')}
        
        Rules:
        1. Keep only strictly financial/market related info.
        2. Rewrite into a short summary (max 15 words) that is punchy.
        3. Determine sentiment: bullish, bearish, or neutral.
        
        Return ONLY valid JSON: [{"processed": "text", "sentiment": "bullish"}]`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        const jsonMatch = text.match(/\[.*\]/s);
        if (jsonMatch) return JSON.parse(jsonMatch[0]);
        return null;
    } catch (e) {
        console.warn("[GEMINI ERROR]", e.message);
        return null;
    }
}

export async function POST(request) {
    const tmpFiles = [];
    const tmpDir = path.join(process.cwd(), 'tmp_video');

    try {
        const body = await request.json();
        const rawQuery = body.topic || 'Latest Market News';
        const apiKey = body.apiKey || process.env.GEMINI_API_KEY;

        // BETTER SEARCH: If query is short, add "stock market" to force financial context
        let searchQuery = rawQuery;
        if (searchQuery.length < 15 && !searchQuery.toLowerCase().includes('stock') && !searchQuery.toLowerCase().includes('market')) {
            searchQuery += " stock market latest news";
        }

        console.log(`[API] Better Search Query: ${searchQuery}`);

        // 1. Fetch News
        const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${encodeURIComponent(searchQuery)}&hl=en-US&gl=US&ceid=US:en`);
        const topNews = feed.items.slice(0, 10).map(i => cleanHeadline(i.title)).filter(h => h.length > 20);

        if (topNews.length === 0) {
            return NextResponse.json({ error: "No news found." }, { status: 404 });
        }

        // 2. Setup
        const publicDir = path.join(process.cwd(), 'public');
        if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

        // 3. AI Curation Logic
        let processedItems = [];
        const geminiResult = await useGemini(apiKey, topNews.slice(0, 8), rawQuery);

        if (geminiResult && geminiResult.length > 0) {
            processedItems = geminiResult.map(item => ({
                title: item.processed,
                sentiment: item.sentiment.toLowerCase()
            }));
        } else {
            processedItems = topNews.slice(0, 8).map(headline => ({
                title: headline,
                sentiment: headline.toLowerCase().includes('surge') || headline.toLowerCase().includes('up') ? 'bullish' :
                    headline.toLowerCase().includes('crash') || headline.toLowerCase().includes('down') ? 'bearish' : 'neutral'
            }));
        }

        const newsItems = [];
        const slideDuration = 8;

        // 4. TTS
        console.log("[API] Generating High-Quality Audio...");
        for (let i = 0; i < processedItems.length; i++) {
            const item = processedItems[i];
            const audioUrl = googleTTS.getAudioUrl(item.title.substring(0, 190), {
                lang: 'en-US',
                slow: false,
                host: 'https://translate.google.com',
            });
            const audioPath = path.join(tmpDir, `audio-${Date.now()}-${i}.mp3`);
            await downloadFile(audioUrl, audioPath);
            tmpFiles.push(audioPath);
            newsItems.push({ ...item, audioPath });
        }

        const totalDuration = newsItems.length * slideDuration;
        const outputVideoName = `video-${Date.now()}.mp4`;
        const outputPath = path.join(publicDir, outputVideoName);

        // 5. Render Video (Mobile Optimized)
        console.log("[API] Rendering Video...");
        const fontOption = process.platform === 'win32' ? "fontfile='C\\\\:/Windows/Fonts/arial.ttf'" : "";

        await new Promise((resolve, reject) => {
            const command = ffmpeg();
            command.input(`testsrc=duration=${totalDuration}:size=1080x1920:rate=30`).inputFormat('lavfi');
            newsItems.forEach(item => command.input(item.audioPath));

            let drawTextFilters = [];
            newsItems.forEach((item, index) => {
                const start = index * slideDuration;
                const end = (index + 1) * slideDuration;
                const boxColor = item.sentiment === 'bullish' ? '0x00FF00@0.3' :
                    item.sentiment === 'bearish' ? '0xFF0000@0.3' : '0xFFFFFF@0.1';

                // Adjusted for vertical mobile screens
                const wrappedLines = wrapText(item.title, 18);
                wrappedLines.forEach((line, lineIndex) => {
                    const yOffset = 850 + (lineIndex * 110);
                    drawTextFilters.push(`drawtext=${fontOption}:text='${line}':fontcolor=white:fontsize=85:x=(w-text_w)/2:y=${yOffset}:enable='between(t,${start},${end})':shadowcolor=black:shadowx=3:shadowy=3`);
                });

                // Sentiment Badge
                drawTextFilters.push(`drawtext=${fontOption}:text='${item.sentiment.toUpperCase()}':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=720:enable='between(t,${start},${end})':box=1:boxcolor=${boxColor}:boxborderw=20`);
            });

            // Universal Header
            const safeTopic = rawQuery.toUpperCase().replace(/[^A-Z ]/g, '');
            drawTextFilters.push(`drawtext=${fontOption}:text='${safeTopic}':fontcolor=yellow:fontsize=70:x=(w-text_w)/2:y=200:enable='between(t,0,${totalDuration})':shadowcolor=black:shadowx=2:shadowy=2`);

            const audioConcatFilter = newsItems.map((_, i) => `[${i + 1}:a]`).join('') + `concat=n=${newsItems.length}:v=0:a=1[outa]`;

            command.complexFilter([
                { filter: 'boxblur', options: '40:20', inputs: '0:v', outputs: 'vblur' },
                { filter: 'format', options: 'yuv420p', inputs: 'vblur', outputs: 'vformat' },
                { filter: drawTextFilters.join(','), inputs: 'vformat', outputs: 'vfinal' },
                audioConcatFilter
            ])
                .outputOptions(['-map [vfinal]', '-map [outa]', '-c:v libx264', '-c:a aac', '-shortest', '-y'])
                .on('end', () => resolve())
                .on('error', (err) => reject(err))
                .save(outputPath);
        });

        tmpFiles.forEach(f => { try { fs.unlinkSync(f); } catch (e) { } });
        return NextResponse.json({ success: true, url: `/${outputVideoName}` });

    } catch (error) {
        console.error('[API ERROR SEVERE]', error);
        tmpFiles.forEach(f => { try { if (fs.existsSync(f)) fs.unlinkSync(f); } catch (e) { } });
        return NextResponse.json({ error: error.message || "Internal Error" }, { status: 500 });
    }
}
