import * as React from 'react'
import { cn } from '@renderer/lib/utils'

interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: 'horizontal' | 'vertical'
}

export const Separator: React.FC<SeparatorProps> = ({ className, orientation = 'horizontal', ...props }) => {
  return (
    <div
      className={cn(
        'shrink-0 bg-border',
        orientation === 'horizontal' ? 'h-px w-full' : 'h-full w-px',
        className
      )}
      role="separator"
      data-orientation={orientation}
      {...props}
    />
  )
}
