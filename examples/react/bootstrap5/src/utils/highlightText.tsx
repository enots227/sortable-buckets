import React from 'react'

export function highlightText(text: string, search: string): React.ReactNode {
  if (!search) {
    // eslint-disable-next-line no-console
    console.warn('highlightText: search is empty')
    return text
  }

  const res: React.ReactNode[] = []
  let str = text.toLowerCase()
  const searchLowerCase = search.toLowerCase()
  let k = 0
  do {
    const startPos = str.indexOf(searchLowerCase)
    const endPos = startPos + searchLowerCase.length

    res.push(<span key={k++}>{str.substring(0, startPos)}</span>)
    res.push(<b key={k++}>{str.substring(startPos, endPos)}</b>)
    str = str.substring(endPos)
  } while (str.includes(searchLowerCase))

  if (str.length > 0) res.push(<span key={k}>{str}</span>)

  return res
}
