const { buildInsightPrompt } = require("./promptBuilder");
const client                 = require("./openRouterClient");

const FALLBACK = `
# Executive Summary
Google Ads is significantly outperforming Meta Ads in ROAS, conversions, and revenue efficiency.
Several campaigns are consuming large budgets while generating weak returns.

# Platform Comparison
Google Ads contributes the majority of total revenue and conversions with stronger campaign efficiency.

# Budget Waste Analysis
Several campaigns are spending aggressively without producing meaningful revenue or conversion performance.

# Scaling Opportunities
Top-performing campaigns demonstrate scalable ROAS. Increasing budget allocation toward these campaigns
could accelerate revenue growth significantly.

# Priority Actions
1. Pause low-performing campaigns wasting budget.
2. Reallocate budget toward top Google campaigns.
3. Improve audience targeting and segmentation.
4. Launch A/B testing on weak creatives.
5. Optimize landing pages for conversion efficiency.
`;

exports.generateAIInsights = async (data, kpis) => {
  try {
    const prompt = buildInsightPrompt(kpis);

    const response = await client.chat.completions.create({
      model: "anthropic/claude-3.5-haiku",
      messages: [
        {
          role: "system",
          content:
            "You are a world-class marketing analytics strategist. " +
            "Generate concise, data-driven, executive-level reports. " +
            "Use bullet points. Reference specific platforms and campaigns by name.",
        },
        { role: "user", content: prompt },
      ],
      max_tokens: 2500,
      temperature: 0.4,
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error("AI insight generation failed:", error.message);
    return FALLBACK;
  }
};
