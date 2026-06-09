const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

exports.generateInsights = async (summaryData) => {
  try {
    const prompt = `
You are an elite AI marketing strategist and performance analyst.

Analyze the combined Meta Ads and Google Ads dataset like a senior growth consultant.

Your response MUST:

1. Interpret the data deeply
2. Compare platform performance
3. Identify strongest and weakest campaigns
4. Detect budget waste
5. Detect anomalies
6. Prioritize optimization opportunities
7. Suggest exact business actions
8. Explain WHY each action matters
9. Forecast possible growth opportunities
10. Write insights in executive-level business language

Return the response in this EXACT structure:

# Executive Summary

# Platform Comparison

# Campaign Intelligence

# Budget Waste Analysis

# Audience Insights

# Scaling Opportunities

# Forecasting

# Priority Actions

# Risk Detection

# Final Strategic Recommendations

IMPORTANT RULES:

- Never give generic responses
- Never say "data unavailable" unless truly missing
- Always explain WHY metrics matter
- Always prioritize recommendations
- Mention specific campaigns/platforms
- Use business language
- Give actionable recommendations

MARKETING DATA:
${JSON.stringify(summaryData, null, 2)}
`;

    const response = await client.chat.completions.create({
      model: "gpt-4.1-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a world-class marketing analytics strategist.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 2500,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI Insight Error:", error);

    return `
# Executive Summary
Unable to generate AI insights at this moment.

# Platform Comparison
AI service temporarily unavailable.

# Campaign Intelligence
Please retry analysis.

# Final Strategic Recommendations
- Check OpenAI API Key
- Reduce dataset size
- Retry request
`;
  }
};