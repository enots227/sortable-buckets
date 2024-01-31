import React from 'react'

export function highlightText(text: string, search: string) {
  if (!search) {
    console.warn('highlightText: search is empty')
    return text
  }

  let res: React.ReactNode[] = []
  let str = text.toLowerCase()
  search = search.toLowerCase()
  let k = 0
  do {
    const startPos = str.indexOf(search)
    const endPos = startPos + search.length

    res.push(<span key={k++}>{str.substring(0, startPos)}</span>)
    res.push(<b key={k++}>{str.substring(startPos, endPos)}</b>)
    str = str.substring(endPos)
  } while (str.includes(search))

  if (str.length > 0) res.push(<span key={k}>{str}</span>)

  return res
}
