"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { validatePhone } from "@/lib/validation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { User, Phone, Mail, Check, Bell, PhoneCall } from "lucide-react"
import { Switch } from "@/components/ui/switch"

export default function ProfilePage() {
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user?.name || "")
  const [phone, setPhone] = useState(user?.phone || "")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(user?.emailNotificationsEnabled || false)
  const [phoneNotifications, setPhoneNotifications] = useState(user?.phoneNotificationsEnabled || false)

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10)
    return digits
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSuccess(false)

    if (!name.trim()) {
      setError("Name is required")
      return
    }

    const phoneValidation = validatePhone(phone)
    if (!phoneValidation.valid) {
      setError(phoneValidation.error || "Invalid phone number")
      return
    }

    setIsLoading(true)
    await updateUser({
      name: name.trim(),
      phone,
      emailNotificationsEnabled: emailNotifications,
      phoneNotificationsEnabled: phoneNotifications,
    })
    setIsLoading(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const handleEmailNotificationsToggle = async (enabled: boolean) => {
    setEmailNotifications(enabled)
    await updateUser({ emailNotificationsEnabled: enabled })
  }

  const handlePhoneNotificationsToggle = async (enabled: boolean) => {
    setPhoneNotifications(enabled)
    await updateUser({ phoneNotificationsEnabled: enabled })
  }

  useEffect(() => {
    if (user) {
      setName(user.name || "")
      setPhone(user.phone || "")
      setEmailNotifications(user.emailNotificationsEnabled || false)
      setPhoneNotifications(user.phoneNotificationsEnabled || false)
    }
  }, [user])

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your account information</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground text-2xl font-semibold">
                {user?.name?.charAt(0).toUpperCase() || "U"}
              </div>
              <div>
                <CardTitle>{user?.name}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Personal Information</CardTitle>
            <CardDescription>Update your personal details</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}
              {success && (
                <div className="p-3 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 rounded-md flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  Profile updated successfully
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  Full Name
                </Label>
                <Input id="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  Email
                </Label>
                <Input id="email" type="email" value={user?.email || ""} disabled className="bg-muted" />
                <p className="text-xs text-muted-foreground">Email cannot be changed</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-notifications" className="flex items-center gap-2 cursor-pointer">
                    <Bell className="h-4 w-4 text-muted-foreground" />
                    Notify via Email
                  </Label>
                  <Switch
                    id="email-notifications"
                    checked={emailNotifications}
                    onCheckedChange={handleEmailNotificationsToggle}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Receive email notifications when telemetry events are received for your vehicles
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  Phone Number
                </Label>
                <div className="flex gap-2">
                  <div className="flex items-center px-3 border rounded-md bg-muted text-muted-foreground text-sm">
                    +91
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="9876543210"
                    value={phone}
                    onChange={(e) => setPhone(formatPhoneNumber(e.target.value))}
                    className="flex-1"
                  />
                </div>
                <p className="text-xs text-muted-foreground">Must be a valid 10-digit Indian phone number</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="phone-notifications" className="flex items-center gap-2 cursor-pointer">
                    <PhoneCall className="h-4 w-4 text-muted-foreground" />
                    Notify via Phone Call
                  </Label>
                  <Switch
                    id="phone-notifications"
                    checked={phoneNotifications}
                    onCheckedChange={handlePhoneNotificationsToggle}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Receive phone call alerts for warning and critical vehicle health issues
                </p>
              </div>

              <div className="pt-2">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
