"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { iterateCode } from "@/app/actions"
import { Loader2, Code, CheckCircle, AlertCircle, RefreshCw } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"

export default function CodeIterator() {
  const [code, setCode] = useState("")
  const [prompt, setPrompt] = useState("")
  const [response, setResponse] = useState<{ modifiedCode: string; explanation: string } | null>(null)
  const [finalCode, setFinalCode] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { toast } = useToast()

  const handleSubmit = async () => {
    if (!code.trim()) {
      toast({
        title: "Missing code",
        description: "Please paste your code before submitting",
        variant: "destructive",
      })
      return
    }

    if (!prompt.trim()) {
      toast({
        title: "Missing prompt",
        description: "Please describe the changes you want to make",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await iterateCode(code, prompt)

      // Check if the response contains the expected fields
      if (!result.modifiedCode || !result.explanation) {
        toast({
          title: "Incomplete response",
          description: "The AI returned an incomplete response. Some information may be missing.",
          variant: "warning",
        })
      }

      setResponse(result)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      setResponse(null)

      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRetry = async () => {
    if (!code || !prompt) return

    toast({
      title: "Retrying",
      description: "Sending your request again with different parameters",
    })

    setIsLoading(true)
    setError(null)

    try {
      // Add a hint to the prompt to ensure proper formatting
      const enhancedPrompt = `${prompt}\n\nIMPORTANT: Please ensure your response is in valid JSON format with 'modifiedCode' and 'explanation' fields.`

      const result = await iterateCode(code, enhancedPrompt)
      setResponse(result)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred"
      setError(errorMessage)
      setResponse(null)
    } finally {
      setIsLoading(false)
    }
  }

  const handleIntegrate = () => {
    if (response) {
      setFinalCode(response.modifiedCode)
      toast({
        title: "Code integrated",
        description: "The suggested code has been integrated into your final output",
      })
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: "The code has been copied to your clipboard",
    })
  }

  return (
    <div className="container py-8 mx-auto">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">AI Code Iterator</h1>
        <p className="text-muted-foreground mt-2">
          Paste your code, describe the changes, and let AI suggest improvements
        </p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Input</CardTitle>
            <CardDescription>Paste your code and describe what changes you'd like to make</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="code" className="text-sm font-medium mb-2 block">
                Your Code
              </label>
              <Textarea
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Paste your code here..."
                className="font-mono h-[300px]"
              />
            </div>
            <div>
              <label htmlFor="prompt" className="text-sm font-medium mb-2 block">
                Describe the Change
              </label>
              <Textarea
                id="prompt"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Add error handling, implement dark mode, optimize performance..."
                className="h-[100px]"
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSubmit} disabled={isLoading} className="w-full">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Code className="mr-2 h-4 w-4" />
                  Suggest Changes
                </>
              )}
            </Button>
          </CardFooter>
        </Card>

        {error && (
          <Card className="md:col-span-2 border-red-200">
            <CardContent className="pt-6">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <Button variant="outline" className="mt-4 w-full" onClick={handleRetry} disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry with Different Parameters
              </Button>
            </CardContent>
          </Card>
        )}

        {response && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>AI Suggestion</span>
                <Badge variant="outline" className="ml-2">
                  Generated
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="code">
                <TabsList className="mb-4">
                  <TabsTrigger value="code">Modified Code</TabsTrigger>
                  <TabsTrigger value="explanation">Explanation</TabsTrigger>
                </TabsList>
                <TabsContent value="code" className="mt-0">
                  <div className="relative">
                    <pre className="bg-muted p-4 rounded-md overflow-auto font-mono text-sm whitespace-pre-wrap max-h-[400px]">
                      {response.modifiedCode}
                    </pre>
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(response.modifiedCode)}
                    >
                      Copy
                    </Button>
                  </div>
                </TabsContent>
                <TabsContent value="explanation" className="mt-0">
                  <div className="bg-muted p-4 rounded-md max-h-[400px] overflow-auto">
                    <p className="whitespace-pre-wrap">{response.explanation}</p>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
            <CardFooter className="flex flex-col sm:flex-row gap-2">
              <Button onClick={handleIntegrate} className="w-full" variant="default">
                <CheckCircle className="mr-2 h-4 w-4" />
                Integrate Changes
              </Button>
              <Button onClick={handleRetry} className="w-full" variant="outline" disabled={isLoading}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Try Again
              </Button>
            </CardFooter>
          </Card>
        )}

        {finalCode && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Final Output</span>
                <Badge variant="success" className="bg-green-100 text-green-800 hover:bg-green-200">
                  Integrated
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <pre className="bg-green-50 p-4 rounded-md overflow-auto font-mono text-sm whitespace-pre-wrap max-h-[400px]">
                  {finalCode}
                </pre>
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(finalCode)}
                >
                  Copy
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
