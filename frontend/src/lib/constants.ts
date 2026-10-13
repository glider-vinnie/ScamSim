import React from 'react'
import { ShieldCheck, CircleAlert, TriangleAlert } from 'lucide-react'
import { Skill } from './types'

export const SKILL_LABELS: Record<Skill, string> = {
  urgency: 'Spotting Urgency & Pressure',
  impersonation: 'Detecting Impersonation',
  payment_verification: 'Payment Verification',
  qr_collect: 'QR & Collect Requests',
  safe_verification: 'Independent Safe Verification',
}

export const CATEGORY_LABELS: Record<string, string> = {
  upi_request: 'UPI Request Scam',
  fake_confirmation: 'Fake Confirmation',
  qr_manipulation: 'QR Manipulation',
  impersonation: 'Authority Impersonation',
  fake_offer: 'Fake Job/Offer',
  account_verification: 'Account Verification',
}

export function getScoreLabel(score: number): { label: string; icon: React.ReactNode; color: string } {
  if (score >= 80) {
    return {
      label: 'Sharp eye',
      icon: React.createElement(ShieldCheck, { className: 'text-teal', size: 20 }),
      color: 'text-teal',
    }
  }
  if (score >= 50) {
    return {
      label: 'Getting there',
      icon: React.createElement(CircleAlert, { className: 'text-sand', size: 20 }),
      color: 'text-navy',
    }
  }
  return {
    label: 'Needs practice',
    icon: React.createElement(TriangleAlert, { className: 'text-coral', size: 20 }),
    color: 'text-berry',
  }
}
