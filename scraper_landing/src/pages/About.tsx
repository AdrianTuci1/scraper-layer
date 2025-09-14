import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card"
import { useTranslation } from "react-i18next"

export function About() {
  const { t } = useTranslation()
  const team = t('about.team.members', { returnObjects: true }) as Array<{
    name: string
    role: string
    description: string
    image: string
  }>

  const values = t('about.values.items', { returnObjects: true }) as Array<{
    title: string
    description: string
    icon: string
  }>

  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Hero Section */}
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('about.title')}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {t('about.subtitle')}
          </p>
        </div>

        {/* Story Section */}
        <div className="mx-auto mt-16 max-w-2xl lg:max-w-none">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                {t('about.story.title')}
              </h2>
              <p className="mt-6 text-base leading-7 text-gray-600">
                {t('about.story.description1')}
              </p>
              <p className="mt-4 text-base leading-7 text-gray-600">
                {t('about.story.description2')}
              </p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg p-8">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('about.vision.title')}</h3>
              <p className="text-gray-600">
                {t('about.vision.description')}
              </p>
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center mb-12">
            {t('about.values.title')}
          </h2>
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {values.map((value, index) => (
              <Card key={index}>
                <CardHeader className="text-center">
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <CardTitle className="text-lg">{value.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {value.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900 text-center mb-12">
            {t('about.team.title')}
          </h2>
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
            {team.map((member, index) => (
              <Card key={index}>
                <CardHeader className="text-center">
                  <div className="text-6xl mb-4">{member.image}</div>
                  <CardTitle className="text-xl">{member.name}</CardTitle>
                  <CardDescription className="text-lg font-medium text-blue-600">
                    {member.role}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-center">
                    {member.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="mx-auto mt-16 max-w-2xl text-center">
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {t('about.cta.title')}
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {t('about.cta.subtitle')}
          </p>
          <div className="mt-8">
            <a
              href="mailto:jobs@scraperlayer.com"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              {t('about.cta.button')}
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
