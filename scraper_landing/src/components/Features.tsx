import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card"
import { useTranslation } from "react-i18next"

export function Features() {
  const { t } = useTranslation()
  const features = t('features.items', { returnObjects: true }) as Array<{
    title: string
    description: string
    icon: string
  }>

  return (
    <section className="py-24 sm:py-32 bg-gray-800">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {t('features.title')}
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            {t('features.subtitle')}
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="relative">
                <CardHeader>
                  <div className="text-4xl mb-4">{feature.icon}</div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
