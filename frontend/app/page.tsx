"use client"

import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { DollarSign, Network, FileText, X, CheckCircle } from "lucide-react"
import { useState } from "react"
import Image from "next/image"
// --- NEW IMPORT for Next.js navigation ---
import { useRouter } from "next/navigation" 
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SparroLanding() {
  // --- Initialize Router Hook ---
  const router = useRouter()
  
  const [isHovering, setIsHovering] = useState(false)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [email, setEmail] = useState("")
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [hasJoinedWaitlist, setHasJoinedWaitlist] = useState(false) 

  // Function to handle the waitlist form submission
  const handleSubmit = (e) => {
    e.preventDefault()
    // Simulate API call success
    console.log("Waitlist email submitted:", email)
    
    // Update both states to show success in the dialog and to track status globally
    setIsSubmitted(true)
    setHasJoinedWaitlist(true)
  }

  // Function to handle the "Sign In" button click
  const handleSignIn = () => {
    router.push("/onboarding")
  }
  
  // Function to reset state when dialog is opened or closed
  const resetDialog = (openState) => {
    setIsDialogOpen(openState)
    if (!openState) {
      if (!hasJoinedWaitlist) { 
        setEmail("")
        setIsSubmitted(false)
      }
    }
  }

  // Determine the text, style, and handler for the main CTA button
  const ctaButtonText = hasJoinedWaitlist ? "You're on the Waitlist! 🎉" : (isHovering ? "Join Waitlist — No Card Needed" : "Join Waitlist — No Card Needed")
  const ctaButtonClasses = hasJoinedWaitlist 
    ? "bg-gradient-to-r from-lime-500 to-emerald-500 hover:from-lime-500/90 hover:to-emerald-500/90 text-white font-bold text-xl px-10 py-7 rounded-full shadow-2xl shadow-lime-500/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(132,204,22,0.6)] hover:scale-105 flex items-center gap-3"
    : "bg-gradient-to-r from-[#FF6F3C] to-[#FF8C5C] hover:from-[#FF6F3C]/90 hover:to-[#FF8C5C]/90 text-white font-bold text-xl px-10 py-7 rounded-full shadow-2xl shadow-[#FF6F3C]/50 transition-all duration-300 hover:shadow-[0_0_40px_rgba(255,111,60,0.6)] hover:scale-105"
  const ctaButtonHandler = hasJoinedWaitlist ? () => alert("You're already on the waitlist!") : () => setIsDialogOpen(true)


  // Waitlist Dialog Component (remains largely unchanged)
  const WaitlistDialog = () => (
    <Dialog open={isDialogOpen} onOpenChange={resetDialog}>
      <DialogContent className="sm:max-w-[425px] bg-slate-900 border-2 border-teal-400/40 p-6 rounded-2xl shadow-2xl shadow-teal-400/30">
        <DialogHeader className="p-0 space-y-3">
          <Button
            onClick={() => resetDialog(false)}
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4 rounded-full text-white/70 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </Button>
          
          <div className="flex items-center justify-center pt-2">
            {isSubmitted ? (
              <CheckCircle className="w-12 h-12 text-lime-400" />
            ) : (
              <Image src="/sparro-logo.jpg" alt="Sparro" width={48} height={48} className="drop-shadow-lg rounded-xl" />
            )}
          </div>

          <DialogTitle className="text-2xl font-bold text-white text-center">
            {isSubmitted ? "Welcome Aboard!" : "Lock in Your Beta Spot"}
          </DialogTitle>
          <DialogDescription className="text-white/80 text-center">
            {isSubmitted
              ? "You are officially on the Sparro waitlist. We'll notify you when your beta spot is ready."
              : "Secure your spot for the $97/month beta pricing. No credit card required to join the waitlist."}
          </DialogDescription>
        </DialogHeader>

        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="email" className="text-white font-medium text-base">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="yourname@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="col-span-3 bg-slate-800 border-teal-400/40 text-white placeholder:text-white/40 focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[#FF6F3C] to-[#FF8C5C] hover:from-[#FF6F3C]/90 hover:to-[#FF8C5C]/90 text-white font-bold text-lg px-8 py-6 rounded-full shadow-lg shadow-[#FF6F3C]/50 transition-all duration-300"
              >
                Join Waitlist Now
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="pt-4 pb-2 text-center">
            <p className="text-xl font-semibold text-teal-400">
              Thank you!
            </p>
            <p className="text-sm text-white/70 mt-2">
              Check your inbox for a confirmation email.
            </p>
            <DialogFooter className="pt-6">
               <Button
                onClick={() => resetDialog(false)}
                className="w-full bg-slate-700 hover:bg-slate-600 text-white font-medium py-3 rounded-full"
              >
                Close
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated gradient background and floating polygons remain unchanged */}
      <div className="fixed inset-0 bg-gradient-to-b from-[#1a2332] via-[#1e3a4a] to-[#2d5f6f] -z-10" />

      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute top-20 left-10 w-32 h-32 border border-teal-400/20 rotate-45 animate-float" />
        <div className="absolute top-40 right-20 w-24 h-24 border border-teal-400/20 rotate-12 animate-float-delayed" />
        <div className="absolute bottom-32 left-1/4 w-40 h-40 border border-teal-400/20 -rotate-12 animate-float-slow" />
        <div className="absolute bottom-20 right-1/3 w-28 h-28 border border-teal-400/20 rotate-45 animate-float" />
      </div>

      <nav className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/sparro-logo.jpg" alt="Sparro" width={48} height={48} className="drop-shadow-lg" />
            <span className="text-2xl font-bold text-white tracking-tight">Sparro</span>
          </div>
          {/* --- UPDATED SIGN IN BUTTON WITH onClick HANDLER --- */}
          <Button
            variant="outline"
            className="border-teal-400/50 text-teal-400 hover:bg-teal-400/10 hover:text-teal-300 transition-all duration-300 bg-transparent"
            onClick={handleSignIn} 
          >
            Sign In
          </Button>
          {/* --- END UPDATED SIGN IN BUTTON --- */}
        </div>
      </nav>

      {/* Hero Section and rest of the content remains the same */}
      <section className="container mx-auto px-4 py-8 md:py-16 lg:py-20">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          <div className="w-full lg:w-1/2 space-y-8">
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-[1.1] text-balance">
              Stop Losing{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF6F3C] to-[#FF8C5C] drop-shadow-lg">
                $2,000+
              </span>{" "}
              Every Month. Get Paid Fully, Fast.
            </h1>

            <p className="text-xl md:text-2xl text-white/90 font-medium leading-relaxed text-pretty">
              Sparro unifies all your affiliate networks. Never miss a commission or tax deadline again.
            </p>

            <div className="space-y-5 pt-6">
              <Button
                size="lg"
                className={ctaButtonClasses}
                onMouseEnter={() => setIsHovering(true)}
                onMouseLeave={() => setIsHovering(false)}
                onClick={ctaButtonHandler} 
              >
                {hasJoinedWaitlist && <CheckCircle className="w-6 h-6" />}
                <span className={isHovering && !hasJoinedWaitlist ? "animate-pulse" : ""}>{ctaButtonText}</span>
              </Button>

              <div className="inline-block bg-gradient-to-r from-amber-500/30 to-orange-500/30 border-2 border-amber-400/60 rounded-xl px-6 py-3 backdrop-blur-md shadow-lg shadow-amber-500/20">
                <p className="text-base text-amber-100 font-bold">
                  Only 500 beta spots @$97/month, price jumps to $197 after launch.
                </p>
              </div>

              <p className="text-base text-white/80 font-medium">
                Lock beta pricing with zero risk. Pay only if you stay after beta.
              </p>
            </div>
          </div>

          <div className="w-full lg:w-1/2">
            <div className="relative animate-float-slow">
              <div className="absolute inset-0 bg-gradient-to-br from-teal-400/30 to-blue-500/30 rounded-3xl blur-3xl animate-pulse" />
              <Card className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-teal-400/40 p-8 rounded-3xl shadow-2xl hover:border-teal-400/60 transition-all duration-500">
                <div className="space-y-6">
                  <div className="flex items-center justify-between pb-6 border-b border-teal-400/30">
                    <h3 className="text-white font-bold text-2xl">Dashboard Overview</h3>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                      <span className="text-teal-400 text-sm font-semibold">Live</span>
                    </div>
                  </div>
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <div className="flex justify-between text-base">
                        <span className="text-white/90 font-medium">Amazon Associates</span>
                        <span className="text-teal-400 font-bold text-lg">$4,234</span>
                      </div>
                      <div className="h-4 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full w-[85%] bg-gradient-to-r from-teal-400 to-teal-500 rounded-full shadow-lg shadow-teal-400/60 animate-pulse" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-base">
                        <span className="text-white/90 font-medium">ShareASale</span>
                        <span className="text-blue-400 font-bold text-lg">$2,891</span>
                      </div>
                      <div className="h-4 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full w-[65%] bg-gradient-to-r from-blue-400 to-blue-500 rounded-full shadow-lg shadow-blue-400/60" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-base">
                        <span className="text-white/90 font-medium">CJ Affiliate</span>
                        <span className="text-purple-400 font-bold text-lg">$1,567</span>
                      </div>
                      <div className="h-4 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
                        <div className="h-full w-[45%] bg-gradient-to-r from-purple-400 to-purple-500 rounded-full shadow-lg shadow-purple-400/60" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-6">
                    <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 border border-teal-400/30 shadow-lg">
                      <p className="text-white/60 text-sm font-medium">Total Earnings</p>
                      <p className="text-white font-bold text-2xl mt-1">$8,692</p>
                    </div>
                    <div className="bg-gradient-to-br from-slate-800/70 to-slate-900/70 rounded-xl p-4 border border-teal-400/30 shadow-lg">
                      <p className="text-white/60 text-sm font-medium">Next Payout</p>
                      <p className="text-white font-bold text-2xl mt-1">3 days</p>
                    </div>
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-16 md:py-20">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
          <Card className="bg-gradient-to-br from-slate-900/70 to-slate-800/70 backdrop-blur-xl border-2 border-teal-400/40 p-8 rounded-3xl hover:border-teal-400/70 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-400/30 hover:scale-105 group">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-400/30 to-teal-500/30 rounded-2xl flex items-center justify-center border border-teal-400/40 group-hover:scale-110 transition-transform duration-300">
                <Network className="w-8 h-8 text-teal-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-white font-bold text-2xl">Unified Networks</h3>
                <p className="text-white/80 text-base leading-relaxed">All your affiliate programs in one place.</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/70 to-slate-800/70 backdrop-blur-xl border-2 border-teal-400/40 p-8 rounded-3xl hover:border-teal-400/70 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-400/30 hover:scale-105 group">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-400/30 to-teal-500/30 rounded-2xl flex items-center justify-center border border-teal-400/40 group-hover:scale-110 transition-transform duration-300">
                <DollarSign className="w-8 h-8 text-teal-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-white font-bold text-2xl">Instant Payouts</h3>
                <p className="text-white/80 text-base leading-relaxed">Never miss a commission or payment deadline.</p>
              </div>
            </div>
          </Card>

          <Card className="bg-gradient-to-br from-slate-900/70 to-slate-800/70 backdrop-blur-xl border-2 border-teal-400/40 p-8 rounded-3xl hover:border-teal-400/70 transition-all duration-500 hover:shadow-2xl hover:shadow-teal-400/30 hover:scale-105 group">
            <div className="flex flex-col items-center text-center gap-5">
              <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-teal-400/30 to-teal-500/30 rounded-2xl flex items-center justify-center border border-teal-400/40 group-hover:scale-110 transition-transform duration-300">
                <FileText className="w-8 h-8 text-teal-400" />
              </div>
              <div className="space-y-3">
                <h3 className="text-white font-bold text-2xl">Auto Tax Docs</h3>
                <p className="text-white/80 text-base leading-relaxed">Stress-free compliance and filings.</p>
              </div>
            </div>
          </Card>
        </div>
      </section>

      <section className="container mx-auto px-4 py-10">
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-lime-400/30 to-emerald-400/30 rounded-3xl blur-xl group-hover:blur-2xl transition-all duration-500" />
          <div className="relative bg-gradient-to-r from-slate-900/90 to-slate-800/90 backdrop-blur-xl border-2 border-lime-400/60 rounded-3xl p-8 shadow-2xl shadow-lime-400/20 hover:shadow-lime-400/40 transition-all duration-500">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-lime-400 rounded-full animate-pulse shadow-lg shadow-lime-400/60" />
                <span className="text-lime-400 font-black text-2xl md:text-3xl tracking-tight">
                  Only 500 beta spots available
                </span>
              </div>
              <div className="hidden md:block w-px h-12 bg-lime-400/40" />
              <div className="flex flex-col md:flex-row items-center gap-4 text-lg md:text-xl text-white/90 font-semibold">
                <span className="flex items-center gap-2">
                  <span className="text-lime-400">✓</span> Cancel anytime
                </span>
                <span className="hidden md:inline text-lime-400/40">•</span>
                <span className="flex items-center gap-2">
                  <span className="text-lime-400">✓</span> Full refund if not satisfied
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>


      <footer className="container mx-auto px-4 py-12 mt-16">
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3">
            <Image src="/sparro-logo.jpg" alt="Sparro" width={32} height={32} className="opacity-60" />
            <span className="text-lg font-bold text-white/60">Sparro</span>
          </div>
          <div className="flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-white/50">
            <a href="#" className="hover:text-white/80 transition-colors font-medium">
              Privacy Policy
            </a>
            <span className="hidden md:inline">•</span>
            <a href="#" className="hover:text-white/80 transition-colors font-medium">
              Terms of Service
            </a>
            <span className="hidden md:inline">•</span>
            <a href="#" className="hover:text-white/80 transition-colors font-medium">
              Contact
            </a>
          </div>
          <p className="text-white/40 text-sm">© 2025 Sparro. All rights reserved.</p>
        </div>
      </footer>

      {/* Mobile Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent md:hidden z-50">
        <Button
          size="lg"
          className={ctaButtonClasses + " w-full"}
          onClick={ctaButtonHandler} 
        >
          {hasJoinedWaitlist && <CheckCircle className="w-6 h-6" />}
          {ctaButtonText}
        </Button>
      </div>

      <WaitlistDialog />
    </div>
  )
}