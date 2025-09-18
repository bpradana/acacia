import type * as React from 'react'
import type { WebviewTag } from 'electron'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      webview: React.DetailedHTMLProps<
        React.HTMLAttributes<WebviewTag> & {
          src?: string
          preload?: string
          partition?: string
          allowpopups?: boolean
          useragent?: string
        },
        WebviewTag
      >
    }
  }
}

export {}
