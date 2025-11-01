import { Button } from '@/components/ui/button';
import { pricingPlans } from '@/lib/data';
import { cn } from '@/lib/utils';
import { ChevronRightIcon } from 'lucide-react';
import { FeaturesSection } from './_components/Feature';
import { FeaturesGradient } from './_components/FeaturesGradient';
import { HoverEffect } from '@/components/accernity-ui/CardHover';
import { Link, Navigate } from 'react-router-dom';
import Navbar from './_components/Navbar';
import { useAuth } from '@clerk/clerk-react';

export default function HomeLandingPage() {
  const { isSignedIn, isLoaded } = useAuth();

  // Redirect authenticated users to dashboard
  if (isLoaded && isSignedIn) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="flex flex-col min-h-screen gap-4 selection:bg-primary selection:text-white dark bg-[#0C0A09] ">
      <Navbar />
      <SectionWrapper className="text-center pt-20 md:pt-32">
        <h1 className="text-4xl md:text-4xl lg:text-6xl font-bold mb-2">
          Get data from web pages <br /> with a magic touch.
        </h1>
        <h2 className="text-l md:text-xl lg:text-2xl text-muted-foreground mb-8">
          Easy to use headless scraping
        </h2>
        <img
          src="/flow.png"
          alt="Flow diagram"
          className="mx-auto max-w-full h-auto mb-8"
        />
        <p className="text-muted-foreground text-sm md:text-xl">
          Create, automate, and scale your web scraping projects with ease. No
          coding required.
        </p>

        <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 space-x-0 md:space-x-4">
          <Button
            className="w-40 h-10 rounded-xl text-sm border-primary text-primary hover:text-white hover:bg-primary"
            variant={'outline'}
            asChild
          >
            <Link to="/sign-in">
              Get Started
              <ChevronRightIcon className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
        <p className="text-sm text-primary">
          New users get 200 credits for free upon first login
        </p>
      </SectionWrapper>
      <SectionWrapper
        id="howItWorks"
        primaryTitle="How"
        secondaryTitle="It Works"
      >
        <FeaturesGradient />
      </SectionWrapper>
      <SectionWrapper
        id="scrapingFeatures"
        primaryTitle="Scraping"
        secondaryTitle="Features"
      >
        <FeaturesSection />
      </SectionWrapper>
      <SectionWrapper
        id="pricing"
        className="w-full py-12 md:py-24 lg:py-32"
        primaryTitle="Simple"
        secondaryTitle="Pricing"
      >
        <div className="flex gap-5 w-full mt-10">
          <HoverEffect items={[...pricingPlans]} />
        </div>
      </SectionWrapper>

      <SectionWrapper className="text-center">
        <h2 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-purple-800">
          Start Scraping Today
        </h2>
        <p className="mx-auto max-w-[600px] text-gray-500 md:text-xl dark:text-gray-400">
          Join thousands of users who are already leveraging our powerful web
          scraping platform.
        </p>
        <Link
          className="w-max bg-purple-600 text-white hover:bg-purple-700 transition-colors flex px-4 py-2 rounded-sm items-center"
          to="/sign-in"
        >
          Sign Up Now
          <ChevronRightIcon className="ml-2 h-4 w-4" />
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          No credit card required. Start with 200 free credits.
        </p>
      </SectionWrapper>
    </div>
  );
}

function SectionWrapper({
  children,
  className,
  id,
  primaryTitle,
  secondaryTitle,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
  primaryTitle?: string;
  secondaryTitle?: string;
}) {
  return (
    <section
      className={cn(
        'flex flex-col items-center justify-center gap-4 py-10 box-border max-w-screen-xl mx-auto scroll-mt-[80px] p-5 md:p-10',
        className
      )}
      id={id}
    >
      <div className="text-2xl md:text-4xl lg:text-6xl text-foreground">
        <span className="text-primary">{primaryTitle}</span>{' '}
        <span className="">{secondaryTitle}</span>
      </div>
      {children}
    </section>
  );
}
