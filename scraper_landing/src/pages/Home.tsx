import { Hero } from "../components/Hero"
import { ProblemsSolutions } from "../components/ProblemsSolutions"
import { Features } from "../components/Features"
import { UseCases } from "../components/UseCases"

export function Home() {
  return (
    <div>
      <Hero />
      <ProblemsSolutions />
      <Features />
      <UseCases />
    </div>
  )
}
