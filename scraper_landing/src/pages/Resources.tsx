import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { useTranslation } from "react-i18next"

export function Resources() {
  const { t } = useTranslation()
  
  const comparisons = t('resources.comparisons.items', { returnObjects: true }) as Array<{
    title: string
    description: string
    features: string[]
    link: string
  }>

  const developerGuide = t('resources.developerGuide.sections', { returnObjects: true }) as Array<{
    title: string
    description: string
    link: string
    icon: string
  }>

  const faqs = t('resources.faqs.items', { returnObjects: true }) as Array<{
    question: string
    answer: string
  }>

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('resources.title')}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            {t('resources.subtitle')}
          </p>
        </div>

        {/* Comparisons Section */}
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <h2 className="text-2xl font-bold tracking-tight text-white text-center mb-12">
            {t('resources.comparisons.title')}
          </h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            {comparisons.map((comparison, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader>
                  <CardTitle className="text-xl">{comparison.title}</CardTitle>
                  <CardDescription className="text-base">
                    {comparison.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 mb-4">
                    {comparison.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center text-sm text-gray-300">
                        <svg className="w-4 h-4 text-green-500 mr-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={comparison.link}
                    className="inline-flex items-center text-blue-400 hover:text-blue-300 font-medium"
                  >
                    {t('resources.comparisons.readMore')}
                    <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Developer Guide Section */}
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <h2 className="text-2xl font-bold tracking-tight text-white text-center mb-12">
            {t('resources.developerGuide.title')}
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {developerGuide.map((section, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow duration-200">
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4">{section.icon}</div>
                  <CardTitle className="text-lg">{section.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center mb-4">
                    {section.description}
                  </CardDescription>
                  <a
                    href={section.link}
                    className="block w-full text-center bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    {t('resources.developerGuide.readGuide')}
                  </a>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <h2 className="text-2xl font-bold tracking-tight text-white text-center mb-12">
            {t('resources.faqs.title')}
          </h2>
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <Card key={index}>
                <CardHeader>
                  <CardTitle className="text-lg">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300">{faq.answer}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-white">
            {t('resources.cta.title')}
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            {t('resources.cta.subtitle')}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <a
              href="/documentation"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('resources.cta.documentation')}
            </a>
            <a
              href="/pricing"
              className="inline-flex items-center px-6 py-3 border border-gray-600 text-base font-medium rounded-md text-white bg-gray-800 hover:bg-gray-700"
            >
              {t('resources.cta.pricing')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
