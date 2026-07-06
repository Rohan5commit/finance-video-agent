/**
 * fact-checker.js — Post-generation validation to catch LLM hallucinations
 * 
 * Validates that the generated script only contains claims supported by
 * the provided news stories and market data.
 */

/**
 * Check if news stories mention a concept using word-boundary matching
 * (avoids false positives from substring matching like 'sec' in 'second')
 */
function newsMentions(newsStories, pattern) {
  return newsStories.some(s => {
    const factText = `${s.title || ''} ${s.summary || ''} ${s.keyFact || ''}`;
    return pattern.test(factText);
  });
}

/**
 * Validate script facts against provided news stories and market data.
 * Returns { errors: string[], warnings: string[] }
 * errors = must abort pipeline (fabricated facts)
 * warnings = review but can proceed
 */
export function validateScriptFacts(script, newsStories, marketData) {
  const errors = [];
  const warnings = [];
  const allText = (script.scenes || []).map(s => s.spokenText || '').join(' ');
  const lowerText = allText.toLowerCase();

  // ──────────────────────────────────────────────────────
  // ERROR CHECKS (must abort)
  // ──────────────────────────────────────────────────────

  // 1. Check for fabricated earnings claims
  const earningsPatterns = [
    /reported\s+(quarterly\s+)?revenue/i,
    /beat(s|ing)?\s+(wall\s+street\s+)?estimates/i,
    /beat(s|ing)?\s+(earnings|revenue|profit|expectations)/i,
    /revenue\s+(up|down|grew|fell|increased|decreased|jumped|dropped|surged|plunged|rose|slid)\s+\d/i,
    /profit\s+(up|down|grew|fell|increased|decreased|jumped|dropped|surged|plunged|rose|slid)\s+\d/i,
    /quarterly\s+(earnings|results|revenue)/i,
    /year.over.year/i,
    /\beps\b\s+\$?\d/i,
  ];

  for (const pattern of earningsPatterns) {
    if (pattern.test(allText)) {
      const newsHasEarnings = newsMentions(newsStories, /\bearn\w*\b/i) ||
                              newsMentions(newsStories, /\brevenue\b/i) ||
                              newsMentions(newsStories, /\bquarter\w*\b/i);
      if (!newsHasEarnings) {
        errors.push(`Script mentions earnings/revenue figures but NO news story covers earnings. This is likely hallucinated.`);
        break;
      }
    }
  }

  // 2. Check for fabricated all-time high / record claims
  const athPatterns = [
    /all[\s-]?time\s+high/i,
    /record\s+(high|peak|level|close)/i,
    /new\s+(all[\s-]?time\s+)?high/i,
    /surpassed\s+\$[\d,.]+/i,
    /highest\s+(level|point|price)\s+(ever|in|since)/i,
  ];

  for (const pattern of athPatterns) {
    if (pattern.test(allText)) {
      const newsHasATH = newsMentions(newsStories, /all[\s-]?time\s+high/i) ||
                         newsMentions(newsStories, /record\s+(high|peak|level)/i) ||
                         newsMentions(newsStories, /\brecord\b/i);
      if (!newsHasATH) {
        errors.push(`Script claims an all-time high / record but NO news story supports this.`);
        break;
      }
    }
  }

  // 3. Check for fabricated specific price targets / analyst ratings
  const analystPatterns = [
    /price\s+target\s+of\s+\$/i,
    /analyst\s+(set|raised|lowered|cut)\s+(a\s+)?price\s+target/i,
    /rating\s+(to|from)\s+(buy|sell|hold|overweight|underweight)/i,
    /upgrade\s+to\s+(buy|overweight|outperform)/i,
    /downgrade\s+to\s+(sell|underweight|underperform)/i,
  ];

  for (const pattern of analystPatterns) {
    if (pattern.test(allText)) {
      const newsHasAnalyst = newsMentions(newsStories, /\banalyst\b/i) ||
                             newsMentions(newsStories, /\bprice\s+target\b/i) ||
                             newsMentions(newsStories, /\bupgrade\b/i) ||
                             newsMentions(newsStories, /\bdowngrade\b/i) ||
                             newsMentions(newsStories, /\brating\b/i);
      if (!newsHasAnalyst) {
        errors.push(`Script mentions analyst ratings/price targets but NO news story covers this.`);
        break;
      }
    }
  }

  // 4. Check for fabricated specific day references
  const dayNames = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  for (const day of dayNames) {
    const dayRegex = new RegExp(`\\b(on|last|this|every)\\s+${day}\\b`, 'i');
    if (dayRegex.test(allText)) {
      const dayPattern = new RegExp(`\\b${day}\\b`, 'i');
      const newsHasDay = newsMentions(newsStories, dayPattern);
      if (!newsHasDay) {
        warnings.push(`Script references "${day}" but no news story mentions this day. May be fabricated.`);
      }
    }
  }

  // 5. Check Bitcoin price claims vs actual market data
  if (marketData?.assets) {
    const btcData = marketData.assets.find(a => a.ticker === 'BTC/USD');
    if (btcData) {
      const actualBTC = parseFloat(btcData.value?.replace(/[$,]/g, '') || '0');
      const btcMentions = allText.match(/bitcoin\s+(hit|broke|surpassed|reached|crossed|trading\s+at|price\s+of)\s+\$?([\d,]+)/gi);
      if (btcMentions && actualBTC > 0) {
        for (const mention of btcMentions) {
          const claimedPrice = parseFloat(mention.match(/\$?([\d,]+)/)?.[1]?.replace(/,/g, '') || '0');
          if (claimedPrice > 0 && Math.abs(claimedPrice - actualBTC) / actualBTC > 0.03) {
            errors.push(`Bitcoin price claim ($${claimedPrice}) differs significantly from actual market data ($${actualBTC}).`);
          }
        }
      }
    }
  }

  // 6. Check S&P 500 claims vs actual market data
  if (marketData?.assets) {
    const spyData = marketData.assets.find(a => a.ticker === 'SPY');
    if (spyData) {
      const spyPrice = parseFloat(spyData.value?.replace(/[$,]/g, '') || '0');
      const spyMentions = allText.match(/(s&p\s*500|spy)\s+(hit|broke|surpassed|reached|crossed|trading\s+at)\s+\$?([\d,]+)/gi);
      if (spyMentions && spyPrice > 0) {
        for (const mention of spyMentions) {
          const claimedPrice = parseFloat(mention.match(/\$?([\d,]+)/)?.[1]?.replace(/,/g, '') || '0');
          if (claimedPrice > 0 && Math.abs(claimedPrice - spyPrice) / spyPrice > 0.05) {
            errors.push(`S&P 500 price claim ($${claimedPrice}) differs significantly from actual market data ($${spyPrice}).`);
          }
        }
      }
    }
  }

  // 7. Check for fabricated Fed / government policy claims
  const fedPatterns = [
    /fed\s+(cut|raised|held)\s+(rates|interest)/i,
    /federal\s+reserve\s+(cut|raised|held|decided|announced)/i,
    /\bSEC\s+(approved|rejected|ruled|charged|fined)/i,
    /congress\s+(passed|approved|rejected)/i,
    /president\s+(signed|signed\s+into|vetoed)/i,
  ];

  for (const pattern of fedPatterns) {
    if (pattern.test(allText)) {
      const newsHasFed = newsMentions(newsStories, /\bfed\b/i) ||
                         newsMentions(newsStories, /\bfederal\s+reserve\b/i) ||
                         newsMentions(newsStories, /\binterest\s+rate\b/i) ||
                         newsMentions(newsStories, /\bSEC\b/i) ||
                         newsMentions(newsStories, /\bcongress\b/i) ||
                         newsMentions(newsStories, /\bpresident\b/i);
      if (!newsHasFed) {
        errors.push(`Script mentions Fed/government policy action but NO news story covers this. Likely hallucinated.`);
        break;
      }
    }
  }

  // 8. Verify market data numbers match exactly
  if (marketData?.assets) {
    for (const asset of marketData.assets) {
      if (!asset.ticker || !asset.value) continue;
      const ticker = asset.ticker.replace('/USD', '');
      const actualValue = asset.value.replace(/[$,]/g, '');

      // Find references to this ticker with a specific number
      const tickerRegex = new RegExp(`\\b${ticker}\\b[^\\d]*\\$?([\\d,\\.]+)`, 'gi');
      let match;
      while ((match = tickerRegex.exec(allText)) !== null) {
        const referencedValue = match[1].replace(/,/g, '');
        const refNum = parseFloat(referencedValue);
        const actNum = parseFloat(actualValue);
        if (refNum > 0 && actNum > 0 && Math.abs(refNum - actNum) / actNum > 0.05) {
          const context = allText.slice(Math.max(0, match.index - 30), match.index + match[0].length + 30).toLowerCase();
          if (context.includes('price') || context.includes('trading') || context.includes('value') ||
              context.includes('hit') || context.includes('broke') || context.includes('at ')) {
            warnings.push(`${ticker} price in script ($${referencedValue}) differs from actual ($${actualValue}).`);
          }
        }
      }
    }
  }

  return { errors, warnings };
}
