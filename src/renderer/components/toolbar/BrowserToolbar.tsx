import * as React from 'react'
import { ArrowLeft, ArrowRight, Home, Loader2, Plus, RefreshCcw } from 'lucide-react'
import { Button } from '@renderer/components/ui/button'
import { Input } from '@renderer/components/ui/input'

interface BrowserToolbarProps {
  address: string
  canGoBack: boolean
  canGoForward: boolean
  isLoading: boolean
  onAddressChange: (value: string) => void
  onSubmitAddress: () => void
  onGoBack: () => void
  onGoForward: () => void
  onReload: () => void
  onGoHome: () => void
  onNewRootTab: () => void
}

export const BrowserToolbar: React.FC<BrowserToolbarProps> = ({
  address,
  canGoBack,
  canGoForward,
  isLoading,
  onAddressChange,
  onSubmitAddress,
  onGoBack,
  onGoForward,
  onReload,
  onGoHome,
  onNewRootTab,
}) => {
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault()
    onSubmitAddress()
  }

  return (
    <div className="flex items-center gap-2 border-b border-border bg-card px-3 py-2">
      <Button variant="ghost" size="icon" onClick={onGoBack} disabled={!canGoBack} aria-label="Back">
        <ArrowLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        onClick={onGoForward}
        disabled={!canGoForward}
        aria-label="Forward"
      >
        <ArrowRight className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onReload} aria-label="Reload">
        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
      </Button>
      <Button variant="ghost" size="icon" onClick={onGoHome} aria-label="Home">
        <Home className="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="icon" onClick={onNewRootTab} aria-label="New tab">
        <Plus className="h-4 w-4" />
      </Button>
      <form onSubmit={handleSubmit} className="flex-1">
        <Input
          value={address}
          onChange={event => onAddressChange(event.target.value)}
          placeholder="Enter URL"
          spellCheck={false}
        />
      </form>
    </div>
  )
}
