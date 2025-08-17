import { openai } from "@ai-sdk/openai";
import { generateText } from "ai";
import { createSwapQuoteTool } from "@/lib/ai/tools/cdp";

export const promptAgent = async (prompt: string) => {
	const result = await generateText({
		system:
			"You are an agent that helps users swap tokens on the Base blockchain.",
		model: openai("gpt-4o"),
		tools: {
			createSwapQuoteTool,
		},
		prompt,
	});

	console.log({ result });
	return result;
};
