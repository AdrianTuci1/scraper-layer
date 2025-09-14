import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { Badge } from "../components/ui/badge"
import { useTranslation } from "react-i18next"

export function Documentation() {
  const { t } = useTranslation()
  const sections = t('documentation.sections', { returnObjects: true }) as Array<{
    title: string
    description: string
    items: string[]
  }>

  const codeExamples = [
    {
      language: "Node.js",
      code: `const response = await fetch('https://api.scraperlayer.com/v1/scrape', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: 'https://example.com',
    format: 'json',
    wait_for: 2000
  })
});

const data = await response.json();
console.log(data);`
    },
    {
      language: "Python",
      code: `import requests

url = "https://api.scraperlayer.com/v1/scrape"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
data = {
    "url": "https://example.com",
    "format": "json",
    "wait_for": 2000
}

response = requests.post(url, headers=headers, json=data)
result = response.json()
print(result)`
    },
    {
      language: "cURL",
      code: `curl -X POST https://api.scraperlayer.com/v1/scrape \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "url": "https://example.com",
    "format": "json",
    "wait_for": 2000
  }'`
    }
  ]

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('documentation.title')}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {t('documentation.subtitle')}
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {sections.map((section, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-xl">{section.title}</CardTitle>
                  <CardDescription>{section.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex items-center">
                        <svg className="h-4 w-4 text-blue-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm text-gray-600">{item}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="mx-auto mt-16 max-w-4xl">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center mb-8">
            {t('documentation.codeExamples')}
          </h2>
          <div className="space-y-6">
            {codeExamples.map((example, index) => (
              <Card key={index}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{example.language}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{example.code}</code>
                  </pre>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
