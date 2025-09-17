import { Button } from "./ui/button"
import { useTranslation } from "react-i18next"

export function Hero() {
  const { t } = useTranslation()

  return (
    <section className="relative overflow-hidden from-gray-800 to-gray-900 py-20 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
            {t('hero.title')}
          </h1>
          <p className="mt-6 text-lg leading-8 text-gray-300">
            {t('hero.subtitle')}
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              {t('hero.getStarted')}
            </Button>
            <Button variant="outline" size="lg">
              {t('hero.requestDemo')}
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
