"use client"

import React from 'react'

const BannerIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8v12" />
    <path d="M48 8v12" />
    <rect x="4" y="20" width="56" height="36" rx="2" />
    <circle cx="32" cy="38" r="6" />
    <path d="M32 28v-4" />
    <path d="M32 52v-4" />
    <path d="M22 38h-4" />
    <path d="M46 38h-4" />
    <path d="M24 28l-3-3" />
    <path d="M40 48l3 3" />
    <path d="M40 28l3-3" />
    <path d="M24 48l-3 3" />
  </svg>
)

const LettersIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className} style={style}>
    <text x="50%" y="52%" dominantBaseline="middle" textAnchor="middle" fontSize="24" fontWeight="bold" fontFamily="Arial, sans-serif" fill="currentColor">ABC</text>
  </svg>
)

const NeonIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="20" width="48" height="24" rx="8" />
    <path d="M16 32c2-3 6-3 8 0s6 3 8 0s6-3 8 0s6 3 8 0" />
  </svg>
)

const DecorIcon = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" className={className} style={style} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M32 12v6" />
    <path d="M32 46v6" />
    <path d="M12 32h6" />
    <path d="M46 32h6" />
    <circle cx="32" cy="32" r="6" />
    <path d="M18 18l4 4" />
    <path d="M42 42l4 4" />
    <path d="M42 18l-4 4" />
    <path d="M18 42l4-4" />
  </svg>
)

const icons = [BannerIcon, LettersIcon, NeonIcon, DecorIcon]

export const Info = () => {
    return (
        <div>
            <ul className="grid grid-cols-4 gap-6 my-8 mx-24">
              {[
                "Свяжитесь с нами",
                "Как мы доставляем",
                "Почему именно мы",
                "Об ИП"
                ].map((text, index) => {
                  const Icon = icons[index]
                  return (
                    <li 
                      key={index} 
                      className="flex flex-col items-center justify-center gap-4 transition-transform duration-300 hover:scale-105 cursor-pointer"
                      onMouseEnter={(e) => {
                        const card = e.currentTarget.querySelector('.icon-card') as HTMLDivElement
                        const icon = e.currentTarget.querySelector('svg') as SVGElement
                        if (card) {
                          card.style.backgroundColor = '#45556c'
                          card.style.borderColor = '#334155'
                          card.style.boxShadow = '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                        }
                        if (icon) icon.style.color = '#ffffff'
                      }}
                      onMouseLeave={(e) => {
                        const card = e.currentTarget.querySelector('.icon-card') as HTMLDivElement
                        const icon = e.currentTarget.querySelector('svg') as SVGElement
                        if (card) {
                          card.style.backgroundColor = 'rgb(241, 245, 249)'
                          card.style.borderColor = 'rgb(203, 213, 225)'
                          card.style.boxShadow = '0 10px 15px -3px rgb(0 0 0 / 0.1)'
                        }
                        if (icon) icon.style.color = '#314158'
                      }}
                    >
                      <div 
                        className="icon-card p-4 rounded-2xl shadow-lg border transition-all duration-300"
                        style={{ backgroundColor: 'rgb(241, 245, 249)', borderColor: 'rgb(203, 213, 225)', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      >
                        <Icon className="w-20 h-20" style={{ color: '#0f172a' }} />
                      </div>
                      <span className="text-slate-800 text-lg font-medium text-center">{text}</span>
                    </li>
                  )
                })}
            </ul>
        </div>
    )
}
