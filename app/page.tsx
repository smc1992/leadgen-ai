"use client"

import Link from "next/link"
import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  ArrowRight,
  Users,
  Mail,
  FileText,
  BarChart3,
  Sparkles,
  Zap,
  Shield,
  CheckCircle,
  Star,
  TrendingUp,
  Globe,
  Target,
  Rocket,
  ChevronRight,
  Play
} from "lucide-react"

export default function Home() {
  const [isVisible, setIsVisible] = useState(false)
  const [typedText, setTypedText] = useState("")
  const [currentStat, setCurrentStat] = useState(0)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [scrollY, setScrollY] = useState(0)

  const fullText = "Automated Lead Generation & Outreach Platform"
  const targetNumber = 50000

  const heroRef = useRef<HTMLDivElement>(null)
  const statsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setIsVisible(true)

    // Typing animation
    let currentIndex = 0
    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setTypedText(fullText.slice(0, currentIndex + 1))
        currentIndex++
      } else {
        clearInterval(typingInterval)
      }
    }, 50)

    // Counter animation
    const counterInterval = setInterval(() => {
      setCurrentStat(prev => {
        if (prev < targetNumber) {
          return prev + Math.ceil((targetNumber - prev) / 20)
        }
        clearInterval(counterInterval)
        return targetNumber
      })
    }, 50)

    // Mouse movement for parallax
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }

    // Scroll effect
    const handleScroll = () => {
      setScrollY(window.scrollY)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('scroll', handleScroll)

    return () => {
      clearInterval(typingInterval)
      clearInterval(counterInterval)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-800 overflow-hidden">
      {/* Floating Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-20 left-10 w-20 h-20 bg-blue-400/20 rounded-full blur-xl animate-bounce"
          style={{
            animationDelay: '0s',
            transform: `translate(${mousePosition.x * 0.01}px, ${mousePosition.y * 0.01}px)`
          }}
        ></div>
        <div
          className="absolute top-40 right-20 w-16 h-16 bg-purple-400/20 rounded-full blur-lg animate-pulse"
          style={{
            animationDelay: '1s',
            transform: `translate(${mousePosition.x * -0.01}px, ${mousePosition.y * -0.01}px)`
          }}
        ></div>
        <div
          className="absolute bottom-40 left-1/4 w-24 h-24 bg-indigo-400/20 rounded-full blur-xl animate-ping"
          style={{
            animationDelay: '2s',
            transform: `translate(${mousePosition.x * 0.005}px, ${mousePosition.y * 0.005}px)`
          }}
        ></div>
      </div>

      {/* Navigation */}
      <nav className="relative z-50 border-b border-white/10 bg-white/80 backdrop-blur-xl dark:bg-slate-900/80">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-600 shadow-lg animate-pulse">
                <span className="text-xl font-bold text-white">E</span>
              </div>
              <div className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-green-400 to-emerald-400 animate-pulse"></div>
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
                Emex Express
              </span>
              <p className="text-xs text-slate-500 dark:text-slate-400">Growth Platform</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="secondary" className="hidden sm:flex animate-pulse">
              <Sparkles className="h-3 w-3 mr-1" />
              AI Powered
            </Badge>
            <Link href="/dashboard">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all duration-300 group">
                Dashboard
                <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section ref={heroRef} className="relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 bg-grid-slate-200/50 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25 dark:[mask-image:linear-gradient(0deg,rgba(255,255,255,0.1),rgba(255,255,255,0.5))]"></div>

        {/* Moving Gradient Blobs */}
        <div
          className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full blur-3xl"
          style={{
            transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.05}px) translateX(-50%)`,
          }}
        ></div>
        <div
          className="absolute bottom-0 right-0 w-72 h-72 bg-gradient-to-r from-indigo-400/20 to-pink-400/20 rounded-full blur-3xl"
          style={{
            transform: `translate(${scrollY * -0.1}px, ${scrollY * -0.05}px)`,
          }}
        ></div>

        {/* Wave Effect */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent dark:from-slate-900"></div>
        <svg className="absolute bottom-0 left-0 w-full h-32" viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" className="fill-white dark:fill-slate-900"></path>
          <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" className="fill-white dark:fill-slate-900"></path>
          <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" className="fill-white dark:fill-slate-900"></path>
        </svg>

        <div className="relative container mx-auto px-4 py-24 lg:py-32">
          <div className={`text-center transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            {/* Badge */}
            <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 border-blue-200 dark:from-blue-900/50 dark:to-indigo-900/50 dark:text-blue-300 dark:border-blue-800 animate-bounce">
              <Zap className="h-3 w-3 mr-1" />
              Revolutionizing Lead Generation
            </Badge>

            {/* Headline with Typing Effect */}
            <div className="mb-6">
              <h1 className="text-5xl lg:text-7xl font-bold tracking-tight mb-4">
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                  Automated Lead
                </span>
                <br />
                <span className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent animate-pulse">
                  Generation &
                </span>
                <br />
                <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-slate-300 bg-clip-text text-transparent">
                  Outreach Platform
                </span>
              </h1>
              <div className="text-2xl lg:text-3xl text-slate-600 dark:text-slate-300 font-light">
                {typedText}
                <span className="animate-pulse">|</span>
              </div>
            </div>

            {/* Subheadline */}
            <p className="mx-auto mb-8 max-w-3xl text-xl text-slate-600 dark:text-slate-300 leading-relaxed animate-fade-in">
              Transform your business growth with AI-powered lead generation, intelligent email campaigns,
              and automated content marketing. Scale your outreach efforts while maintaining personal connections.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
              <Link href="/dashboard">
                <Button size="lg" className="group bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg animate-pulse">
                  Start Free Trial
                  <Rocket className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="border-slate-300 hover:border-slate-400 dark:border-slate-600 dark:hover:border-slate-500 px-8 py-4 text-lg group">
                <Play className="h-5 w-5 mr-2 group-hover:scale-110 transition-transform" />
                Watch Demo
                <ChevronRight className="h-5 w-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            {/* Animated Stats */}
            <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2 animate-pulse">
                  {currentStat.toLocaleString()}+
                </div>
                <div className="text-slate-600 dark:text-slate-400">Leads Generated</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2 animate-pulse">
                  98%
                </div>
                <div className="text-slate-600 dark:text-slate-400">Email Deliverability</div>
              </div>
              <div className="text-center transform hover:scale-110 transition-transform duration-300">
                <div className="text-3xl font-bold text-slate-900 dark:text-white mb-2 animate-pulse">
                  24/7
                </div>
                <div className="text-slate-600 dark:text-slate-400">Automated Outreach</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-slate-900 relative">
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-white/50 dark:from-slate-800/50 dark:to-slate-900/50"></div>
        <div className="absolute inset-0 bg-grid-slate-100/50 [mask-image:radial-gradient(ellipse_at_center,white,transparent)] dark:bg-grid-slate-700/25"></div>

        <div className="relative container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 animate-pulse">
              Powerful Features
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              Everything you need to
              <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent animate-pulse"> scale your business</span>
            </h2>
            <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Our comprehensive platform combines cutting-edge AI with proven marketing automation techniques.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature Cards with Enhanced Effects */}
            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 dark:border-slate-700 dark:bg-slate-800 hover:rotate-1">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:from-blue-950/50 dark:to-indigo-950/50"></div>
              <div className="absolute top-4 right-4 w-8 h-8 bg-blue-500/10 rounded-full animate-ping"></div>
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Users className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">Smart Lead Generation</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  AI-powered scraping from LinkedIn and Google Maps with intelligent lead scoring and validation.
                </p>
                <div className="mt-4 flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 dark:border-slate-700 dark:bg-slate-800 hover:-rotate-1">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:from-green-950/50 dark:to-emerald-950/50"></div>
              <div className="absolute top-4 right-4 w-8 h-8 bg-green-500/10 rounded-full animate-pulse"></div>
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Mail className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">Email Automation</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Professional email builder with AI content generation and multi-step sequence campaigns.
                </p>
                <div className="mt-4 flex items-center text-green-600 dark:text-green-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 dark:border-slate-700 dark:bg-slate-800 hover:rotate-1">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:from-purple-950/50 dark:to-pink-950/50"></div>
              <div className="absolute top-4 right-4 w-8 h-8 bg-purple-500/10 rounded-full animate-bounce"></div>
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-pink-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <FileText className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">Content Creation</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Generate engaging content with AI and schedule across social media platforms automatically.
                </p>
                <div className="mt-4 flex items-center text-purple-600 dark:text-purple-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 dark:border-slate-700 dark:bg-slate-800 hover:-rotate-1">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-red-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:from-orange-950/50 dark:to-red-950/50"></div>
              <div className="absolute top-4 right-4 w-8 h-8 bg-orange-500/10 rounded-full animate-pulse"></div>
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500 to-red-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <BarChart3 className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">Advanced Analytics</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Comprehensive dashboards with real-time tracking, ROI analysis, and performance insights.
                </p>
                <div className="mt-4 flex items-center text-orange-600 dark:text-orange-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 dark:border-slate-700 dark:bg-slate-800 hover:rotate-1">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:from-indigo-950/50 dark:to-blue-950/50"></div>
              <div className="absolute top-4 right-4 w-8 h-8 bg-indigo-500/10 rounded-full animate-bounce"></div>
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Shield className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">Compliance & Security</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  GDPR compliant with enterprise-grade security, domain rotation, and anti-spam measures.
                </p>
                <div className="mt-4 flex items-center text-indigo-600 dark:text-indigo-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>

            <div className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 dark:border-slate-700 dark:bg-slate-800 hover:-rotate-1">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-cyan-50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 dark:from-teal-950/50 dark:to-cyan-950/50"></div>
              <div className="absolute top-4 right-4 w-8 h-8 bg-teal-500/10 rounded-full animate-pulse"></div>
              <div className="relative">
                <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Target className="h-7 w-7 text-white" />
                </div>
                <h3 className="mb-3 text-2xl font-bold text-slate-900 dark:text-white">AI Personalization</h3>
                <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                  Leverage knowledge bases and AI to create hyper-personalized outreach that converts.
                </p>
                <div className="mt-4 flex items-center text-teal-600 dark:text-teal-400 font-medium group-hover:translate-x-2 transition-transform duration-300">
                  Learn more <ChevronRight className="h-4 w-4 ml-1" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="py-16 bg-slate-50 dark:bg-slate-800/50 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-2xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-r from-green-200/30 to-blue-200/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative container mx-auto px-4">
          <div className="text-center mb-12">
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4 animate-fade-in">
              Trusted by growing businesses worldwide
            </h3>
            <div className="flex justify-center items-center gap-8 opacity-60 animate-fade-in" style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-2">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400 animate-pulse" style={{ animationDelay: `${i * 0.1}s` }} />
                ))}
                <span className="text-sm font-medium ml-2">4.9/5 from 200+ reviews</span>
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-fade-in">
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                "Emex Express transformed our lead generation process. We've increased our qualified leads by 300% in just 3 months."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-400 to-indigo-500 flex items-center justify-center text-white font-semibold animate-pulse">
                  SM
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Sarah Mitchell</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Marketing Director, TechCorp</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                "The AI personalization is incredible. Our email open rates jumped from 15% to 45% overnight."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-semibold animate-pulse">
                  MR
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Mike Rodriguez</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">Sales Manager, GrowthCo</div>
                </div>
              </div>
            </div>

            <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-slate-800 dark:border dark:border-slate-700 hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 animate-fade-in" style={{ animationDelay: '0.4s' }}>
              <div className="flex items-center gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-slate-700 dark:text-slate-300 mb-4">
                "Finally, a platform that understands B2B sales. The automation is flawless and the results speak for themselves."
              </p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white font-semibold animate-pulse">
                  JL
                </div>
                <div>
                  <div className="font-semibold text-slate-900 dark:text-white">Jennifer Liu</div>
                  <div className="text-sm text-slate-600 dark:text-slate-400">VP Sales, Enterprise Solutions</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 relative overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-indigo-600/90"></div>
          <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>

        <div className="relative container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-4xl lg:text-5xl font-bold text-white mb-6 animate-fade-in">
              Ready to scale your business?
            </h2>
            <p className="text-xl text-blue-100 mb-8 animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Join hundreds of businesses already using Emex Express to automate their growth and increase revenue.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link href="/dashboard">
                <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-50 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold animate-pulse">
                  Start Your Free Trial
                  <Rocket className="h-5 w-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-500 shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 px-8 py-4 text-lg font-semibold">
                Schedule Demo
              </Button>
            </div>
            <p className="text-blue-200 mt-6 text-sm animate-fade-in" style={{ animationDelay: '0.4s' }}>
              No credit card required • 14-day free trial • Cancel anytime
            </p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 relative">
        {/* Animated Footer Background */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-800 to-slate-900"></div>
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-700 to-transparent"></div>

        <div className="relative container mx-auto px-4">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 animate-pulse">
                  <span className="text-lg font-bold text-white">E</span>
                </div>
                <span className="text-xl font-bold">Emex Express</span>
              </div>
              <p className="text-slate-400 mb-4">
                Revolutionizing lead generation and outreach automation with AI-powered solutions.
              </p>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <h4 className="font-semibold mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              </ul>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center animate-fade-in" style={{ animationDelay: '0.4s' }}>
            <p className="text-slate-400">
              © 2025 Emex Express. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white transition-colors">Security</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
