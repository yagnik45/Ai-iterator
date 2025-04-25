"use server"

import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

// Helper function to safely parse JSON with fallbacks
function safeJsonParse(text: string) {
  try {
    // First try direct parsing
    return JSON.parse(text)
  } catch (e) {
    // If direct parsing fails, try to extract JSON from the text
    try {
      // Look for content between curly braces
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0])
      }
    } catch (innerError) {
      console.error("Failed to extract JSON:", innerError)
    }

    // If all parsing attempts fail, create a structured response from the raw text
    return {
      modifiedCode: text,
      explanation: "The AI response couldn't be parsed as JSON. Showing raw response instead.",
    }
  }
}

export async function iterateCode(code: string, prompt: string) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error("OpenAI API key is not configured. Please contact the administrator.")
    }

    // Enhanced system prompt to ensure proper JSON formatting
    const systemPrompt = `You are a code improvement assistant. A user provides code and a prompt to improve it.

You MUST respond with a valid JSON object containing exactly these two fields:
1. "modifiedCode": The improved code as a string
2. "explanation": Your explanation of the changes

Example of the expected response format:
{
  "modifiedCode": "function example() { console.log('Hello world'); }",
  "explanation": "Added a console.log statement to the function."
}

Do not include any text outside of the JSON object. Do not include markdown formatting, code blocks, or any other text.`

    const userMessage = `Code:
${code}

Change Request:
${prompt}`

    const { text } = await generateText({
      model: openai("gpt-4o"),
      system: systemPrompt,
      prompt: userMessage,
      temperature: 0.2, // Lower temperature for more consistent formatting
    })

    // Log the raw response for debugging (in production, consider logging to a secure location)
    console.log("Raw AI response:", text.substring(0, 200) + "...")

    // Use the safe parsing function
    const parsed = safeJsonParse(text)

    // Validate the parsed result has the expected fields
    if (!parsed.modifiedCode || !parsed.explanation) {
      console.error("Parsed response is missing required fields:", parsed)

      // Create a valid response structure even if fields are missing
      return {
        modifiedCode: parsed.modifiedCode || text || "// Error: No code was generated",
        explanation: parsed.explanation || "The AI response was incomplete. Please try again.",
      }
    }

    return {
      modifiedCode: parsed.modifiedCode,
      explanation: parsed.explanation,
    }
  } catch (error) {
    console.error("Error in iterateCode:", error)
    if (error instanceof Error) {
      throw error
    }
    throw new Error("Failed to process your request. Please check your inputs and try again.")
  }
}
