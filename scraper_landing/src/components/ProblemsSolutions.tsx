import { Badge } from "./ui/badge"
import { useTranslation } from "react-i18next"

export function ProblemsSolutions() {
  const { t } = useTranslation()
  const problems = t('problemsSolutions.items', { returnObjects: true }) as Array<{
    title: string
    description: string
    solution: string
  }>

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            {t('problemsSolutions.title')}
          </h2>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            {t('problemsSolutions.subtitle')}
          </p>
        </div>
        
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {problems.map((item, index) => (
              <div key={index} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <Badge variant="destructive" className="text-xs">
                    {t('problemsSolutions.problem')}
                  </Badge>
                  {item.title}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{item.description}</p>
                  <div className="mt-4">
                    <Badge variant="default" className="text-xs mb-2">
                      {t('problemsSolutions.solution')}
                    </Badge>
                    <p className="font-medium text-gray-900">{item.solution}</p>
                  </div>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  )
}
