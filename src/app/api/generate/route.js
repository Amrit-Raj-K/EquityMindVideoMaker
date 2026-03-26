import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import * as googleTTS from 'google-tts-api';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

const execAsync = promisify(exec);
const parser = new Parser();

export async function POST(request) {
  try {
    const body = await request.json();
    const query = body.topic || 'Latest Market News';
    
    console.log(`Starting generation for topic: ${query}`);
    
    // 1. Fetch News
    const feed = await parser.parseURL(`https://news.google.com/rss/search?q=${encodeURIComponent(query)}&hl=en-US&gl=US&ceid=US:en`);
    const topNews = feed.items.slice(0, 3);

    // 2. Generate Audio URLs
    const newsItems = topNews.map(item => {
      // 200 chars is max for google-tts-api free tier
      let textToRead = item.title;
      // remove domain suffix like " - Yahoo Finance" easily found by " - "
      if (textToRead.lastIndexOf(' - ') > 0) {
        textToRead = textToRead.substring(0, textToRead.lastIndexOf(' - '));
      }
      textToRead = textToRead.substring(0, 190);
      
      const audioUrl = googleTTS.getAudioUrl(textToRead, {
        lang: 'en-US',
        slow: false,
        host: 'https://translate.google.com',
      });
      
      return {
        headline: item.title,
        source: item.source || 'News Source',
        audioUrl
      };
    });

    // 3. Render Video via Remotion CLI
    const outName = `video-${Date.now()}.mp4`;
    const publicDir = path.join(process.cwd(), 'public');
    if (!fs.existsSync(publicDir)) {
      fs.mkdirSync(publicDir);
    }
    const outPath = path.join(publicDir, outName);
    
    // Temp props file to avoid CLI escape character issues
    const props = JSON.stringify({ topic: query, newsItems });
    const propsPath = path.join(process.cwd(), `props-${Date.now()}.json`);
    fs.writeFileSync(propsPath, props);

    console.log(`Executing Remotion CLI...`);
    // Each slide is 150 frames. Total slides = newsItems.length
    const totalFrames = newsItems.length * 150;
    
    // Run npx remotion render
    // Using --frames=0-${totalFrames - 1} to perfectly fit the sequences
    const cmd = `npx remotion render src/remotion/index.js NewsTemplate ${outPath} --props=${propsPath} --frames=0-${totalFrames - 1}`;
    
    await execAsync(cmd);
    
    // Cleanup
    fs.unlinkSync(propsPath);

    console.log(`Video generated successfully at ${outPath}`);

    // 4. Return URL
    return NextResponse.json({ url: `/${outName}` });

  } catch (error) {
    console.error('Generation Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
