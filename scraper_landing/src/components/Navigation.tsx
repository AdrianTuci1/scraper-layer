import { useState, useEffect, useRef } from "react"
import { Link, useLocation } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "./ui/button"

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [isLanguageOpen, setIsLanguageOpen] = useState(false)
  const location = useLocation()
  const { t, i18n } = useTranslation()
  const languageRef = useRef<HTMLDivElement>(null)

  const navigation = [
    { name: t('navigation.home'), href: "/" },
    { name: t('navigation.pricing'), href: "/pricing" },
    { name: t('navigation.documentation'), href: "/documentation" },
    { name: t('navigation.resources'), href: "/resources" },
  ]

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng)
    setIsLanguageOpen(false)
  }

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (languageRef.current && !languageRef.current.contains(event.target as Node)) {
        setIsLanguageOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="sticky top-0 z-50 bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 shadow-sm">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center space-x-2 text-2xl font-bold text-blue-400">
                <img src="/layers.webp" alt="Scraper API" className="h-8 w-8" />
              </Link>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-1 pt-1 text-sm font-medium transition-colors duration-200 ${
                    location.pathname === item.href
                      ? "border-b-2 border-blue-400 text-white"
                      : "text-gray-300 hover:text-white hover:border-gray-600"
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center space-x-4">
            {/* Language Switcher */}
            <div className="relative" ref={languageRef}>
              <button
                onClick={() => setIsLanguageOpen(!isLanguageOpen)}
                className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors duration-200"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
                </svg>
                <span>{i18n.language === 'en' ? 'EN' : 'RO'}</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {isLanguageOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-gray-800 rounded-md shadow-lg ring-1 ring-white ring-opacity-5">
                  <div className="py-1">
                    <button
                      onClick={() => changeLanguage('en')}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        i18n.language === 'en' ? 'bg-blue-900/50 text-blue-300' : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {t('language.english')}
                    </button>
                    <button
                      onClick={() => changeLanguage('ro')}
                      className={`block w-full text-left px-4 py-2 text-sm ${
                        i18n.language === 'ro' ? 'bg-blue-900/50 text-blue-300' : 'text-gray-300 hover:bg-gray-700'
                      }`}
                    >
                      {t('language.romanian')}
                    </button>
                  </div>
                </div>
              )}
            </div>
            <Button variant="ghost" className="text-gray-300 hover:text-white">
              {t('navigation.login')}
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              {t('navigation.getStarted')}
            </Button>
          </div>
          <div className="sm:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-gray-300 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-400"
            >
              <span className="sr-only">Deschide meniul principal</span>
              <svg
                className={`${isOpen ? "hidden" : "block"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
              <svg
                className={`${isOpen ? "block" : "hidden"} h-6 w-6`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="sm:hidden">
          <div className="pt-2 pb-3 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block pl-3 pr-4 py-2 text-base font-medium ${
                  location.pathname === item.href
                    ? "bg-blue-900/50 border-blue-400 text-blue-300 border-l-4"
                    : "text-gray-300 hover:text-white hover:bg-gray-800"
                }`}
                onClick={() => setIsOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <div className="pt-4 pb-3 border-t border-gray-700">
              <div className="flex items-center px-4 space-x-3">
                <Button variant="ghost" className="flex-1">
                  {t('navigation.login')}
                </Button>
                <Button className="flex-1">
                  {t('navigation.getStarted')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
