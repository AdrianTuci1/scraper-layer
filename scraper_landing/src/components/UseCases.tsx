import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { Badge } from "./ui/badge"
import { useTranslation } from "react-i18next"

export function UseCases() {
  const { t } = useTranslation()
  const useCases = t('useCases.items', { returnObjects: true }) as Array<{
    title: string
    subtitle: string
    description: string
    features: string[]
    icon: string
  }>

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('useCases.title')}
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {t('useCases.subtitle')}
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {useCases.map((useCase, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="text-4xl mb-4">{useCase.icon}</div>
                  <CardTitle className="text-2xl">{useCase.title}</CardTitle>
                  <CardDescription className="text-lg font-medium text-blue-600">
                    {useCase.subtitle}
                  </CardDescription>
                  <CardDescription className="text-base">
                    {useCase.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {useCase.features.map((feature, featureIndex) => (
                      <Badge key={featureIndex} variant="secondary" className="mr-2 mb-2">
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
