/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
"use client"

import { useState } from "react"
import { GalleryVerticalEnd, CheckCircle } from "lucide-react"
import Link from "next/link"
import { motion } from "framer-motion"

import { cn } from "@/lib/utils"
import { useAuth } from "@/contexts/AuthContext"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { LastUsedMethod } from "@/components/auth/LastUsedMethod"

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { signUp, signInWithGoogle } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    userType: "brand",
  })
  const [complete, setComplete] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value,
    })
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    
    try {
      await signUp(formData.email, formData.password, {
        full_name: formData.fullName,
        user_type: formData.userType,
      })
      // Successful signup, set complete state
      setComplete(true)
    } catch (error: any) {
      setError(error?.message || "Failed to create account")
      setComplete(false) // Ensure complete is false on error
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      await signInWithGoogle()
      // Redirect is handled by OAuth callback
    } catch (error: any) {
      setError(error?.message || "Google sign in failed")
      setIsLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6 w-full max-w-md mx-auto", className)} {...props}>
      {complete ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-green-500/30 bg-green-900/10">
            <CardHeader className="items-center text-center mx-auto w-full">
              <div className="flex flex-col items-center justify-center">
                <CheckCircle className="w-12 h-12 text-green-500 mb-3" />
                <CardTitle className="text-xl">Signup Complete!</CardTitle>
              </div>
              <CardDescription className="text-green-300/80">
                Check your email to verify your account.
              </CardDescription>
            </CardHeader>
          </Card>
        </motion.div>
      ) : (
        <>
          <form onSubmit={handleSignup}>
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center gap-2">
                <Link href="/" className="flex flex-col items-center gap-2 font-medium">
                  <div className="flex size-8 items-center justify-center rounded-md">
                    <GalleryVerticalEnd className="size-6" />
                  </div>
                  <span className="sr-only">AI Rankia</span>
                </Link>
                <h1 className="text-xl font-bold">Create your account</h1>
                <div className="text-center text-sm">
                  Already have an account?{" "}
                  <Link href="/login" className="underline underline-offset-4">
                    Sign in
                  </Link>
                </div>
              </div>
              <LastUsedMethod />
              <div className="flex flex-col gap-4">
                {error && (
                  <div className="text-destructive text-sm">{error}</div>
                )}
                <div className="grid gap-3">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="grid gap-3">
                  <Label>Role</Label>
                  <div className="flex gap-3">
                    <Button
                      type="button"
                      variant={formData.userType === 'brand' ? 'outline' : 'ghost'}
                      onClick={() => setFormData({ ...formData, userType: 'brand' })}
                      disabled={isLoading}
                      className={`flex-1 ${formData.userType === 'brand' ? 'text-blue-400' : ''}`}
                    >
                      Brand
                    </Button>
                    <Button
                      type="button"
                      variant={formData.userType === 'researcher' ? 'outline' : 'ghost'}
                      onClick={() => setFormData({ ...formData, userType: 'researcher' })}
                      disabled={isLoading}
                      className={`flex-1 ${formData.userType === 'researcher' ? 'text-blue-400' : ''}`}
                    >
                      Researcher
                    </Button>
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? "Creating account..." : "Create account"}
                </Button>
              </div>
              <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
                <span className="bg-background text-muted-foreground relative z-10 px-2">
                  Or
                </span>
              </div>
              <div className="grid">
                <Button 
                  variant="outline" 
                  type="button" 
                  className="w-full"
                  onClick={handleGoogleSignup}
                  disabled={isLoading}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                    <path
                      d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      fill="currentColor"
                    />
                  </svg>
                  Continue with Google
                </Button>
              </div>
            </div>
          </form>
          <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
            By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
            and <a href="#">Privacy Policy</a>.
          </div>
        </>
      )}
    </div>
  )
} 