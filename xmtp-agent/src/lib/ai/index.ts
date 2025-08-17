import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
// import { createSwapQuoteTool } from "@/lib/ai/tools/cdp";

export const promptAgent = async (prompt: string) => {
  console.log("received prompt", prompt);

  const result = await generateText({
    system:
      "You are an agent that helps users swap tokens on the Base blockchain.",
    model: openai("gpt-4o"),
    // tools: {
    //   createSwapQuote: createSwapQuoteTool,
    // },
    prompt,
  });

  console.log("result", result);
  await Bun.write("result.json", JSON.stringify(result, null, 2));

  return result;
};
