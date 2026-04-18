'use client'

import { useEffect, useState, useRef } from 'react'

interface DesktopPetProps {
  mood?: 'idle' | 'happy' | 'eating' | 'sleeping' | 'walking'
  onFeed?: () => void
  fishCount?: number
}

// 鼓励话语
const MESSAGES = [
  '加油哦~',
  '你真棒！',
  '休息一下吧~',
  '喵~',
  '继续努力！',
  '慢慢来~',
]

// 桌宠状态
type PetState = 'idle' | 'happy' | 'eating' | 'sleeping' | 'walking'

export default function DesktopPet({ mood = 'idle', onFeed, fishCount = 0 }: DesktopPetProps) {
  const [state, setState] = useState<PetState>(mood)
  const [message, setMessage] = useState('')
  const [showMessage, setShowMessage] = useState(false)
  const [position, setPosition] = useState({ x: 100, y: 100 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [isFollowing, setIsFollowing] = useState(false)
  const [targetPosition, setTargetPosition] = useState({ x: 0, y: 0 })
  const petRef = useRef<HTMLDivElement>(null)
  const animationRef = useRef<number | null>(null)

  // 随机显示消息
  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.8 && state !== 'eating') {
        setMessage(MESSAGES[Math.floor(Math.random() * MESSAGES.length)])
        setShowMessage(true)
        setTimeout(() => setShowMessage(false), 2500)
      }
    }, 15000)
    return () => clearInterval(interval)
  }, [state])

  // 随机行走
  useEffect(() => {
    if (state === 'idle' && !isDragging && !isFollowing) {
      const walkInterval = setInterval(() => {
        if (Math.random() > 0.7) {
          const newX = Math.random() * (window.innerWidth - 150)
          const newY = Math.random() * (window.innerHeight - 200)
          setTargetPosition({ x: newX, y: newY })
          setState('walking')
          setIsFollowing(true)
        }
      }, 8000)
      return () => clearInterval(walkInterval)
    }
  }, [state, isDragging, isFollowing])

  // 移动动画
  useEffect(() => {
    if (isFollowing && state === 'walking') {
      const move = () => {
        setPosition(prev => {
          const dx = targetPosition.x - prev.x
          const dy = targetPosition.y - prev.y
          const distance = Math.sqrt(dx * dx + dy * dy)
          
          if (distance < 5) {
            setState('idle')
            setIsFollowing(false)
            return prev
          }
          
          const speed = 2
          return {
            x: prev.x + (dx / distance) * speed,
            y: prev.y + (dy / distance) * speed,
          }
        })
        animationRef.current = requestAnimationFrame(move)
      }
      animationRef.current = requestAnimationFrame(move)
    }
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [isFollowing, state, targetPosition])

  // 拖拽
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true)
      setDragOffset({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      })
    }
  }

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        setPosition({
          x: e.clientX - dragOffset.x,
          y: e.clientY - dragOffset.y,
        })
      }
    }
    
    const handleMouseUp = () => {
      setIsDragging(false)
    }
    
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove)
      window.addEventListener('mouseup', handleMouseUp)
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging, dragOffset])

  // 点击互动
  const handleClick = () => {
    if (isDragging) return
    
    if (fishCount > 0 && state !== 'eating') {
      setState('eating')
      setMessage('好吃！谢谢~')
      setShowMessage(true)
      onFeed?.()
      setTimeout(() => {
        setState('happy')
        setTimeout(() => setState('idle'), 2000)
      }, 1500)
    } else if (fishCount <= 0) {
      setState('happy')
      setMessage('没有鱼干啦~')
      setShowMessage(true)
      setTimeout(() => {
        setState('idle')
        setShowMessage(false)
      }, 2000)
    }
  }

  // 获取当前状态的图片（用户需要替换成AI生成的GIF）
  const getPetImage = () => {
    // 这里使用占位图片，用户需要替换成AI生成的GIF
    // 图片应该放在 public/pet/ 目录下
    const images: Record<PetState, string> = {
      idle: '/pet/idle.gif',
      happy: '/pet/happy.gif',
      eating: '/pet/eating.gif',
      sleeping: '/pet/sleeping.gif',
      walking: '/pet/walking.gif',
    }
    return images[state]
  }

  // 获取宠物方向
  const getDirection = () => {
    if (state === 'walking') {
      return targetPosition.x > position.x ? 1 : -1
    }
    return 1
  }

  return (
    <div
      ref={petRef}
      className="fixed z-[9999] cursor-grab active:cursor-grabbing select-none"
      style={{
        left: position.x,
        top: position.y,
      }}
    >
      {/* 消息气泡 */}
      {showMessage && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm px-4 py-2 rounded-2xl shadow-lg border border-emerald-100 text-sm whitespace-nowrap animate-bounce">
          <span className="text-emerald-700">{message}</span>
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-transparent border-t-white/95" />
        </div>
      )}
      
      {/* 宠物图片 */}
      <div
        className="relative w-24 h-24 group"
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        style={{
          transform: `scaleX(${getDirection()})`,
        }}
      >
        {/* 使用img标签显示GIF，如果图片不存在则显示占位符 */}
        <img
          src={getPetImage()}
          alt="pet"
          className="w-full h-full object-contain drop-shadow-lg"
          onError={(e) => {
            // 如果图片加载失败，显示一个可爱的占位符
            const target = e.target as HTMLImageElement
            target.style.display = 'none'
            target.parentElement!.innerHTML = `
              <div class="w-full h-full bg-gradient-to-br from-emerald-200 to-teal-300 rounded-full flex items-center justify-center text-4xl shadow-lg group-hover:scale-105 transition-transform">
                🐱
              </div>
            `
          }}
        />
        
        {/* 悬停提示 */}
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-white/80 px-2 py-0.5 rounded-full">
          {fishCount > 0 ? '点击喂鱼干 🐟' : '拖动我~'}
        </div>
      </div>
      
      {/* 鱼干计数 */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 shadow-sm">
        <span className="text-sm">🐟</span>
        <span className="text-sm font-medium text-emerald-700">{fishCount}</span>
      </div>
    </div>
  )
}
