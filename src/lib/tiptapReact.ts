import { useEditor as useTiptapEditor } from '../../node_modules/@tiptap/react/dist/index.js'
import type { DependencyList } from 'react'
import type { EditorOptions } from '@tiptap/core'

export { EditorContent, useEditorState } from '../../node_modules/@tiptap/react/dist/index.js'

type EditorOptionsWithRender = Partial<EditorOptions> & {
  immediatelyRender?: boolean
}

/** TipTap leaves the editor null on the first Next.js render, which crashes the content toolbar. */
export function useEditor(options: EditorOptionsWithRender = {}, deps?: DependencyList) {
  return useTiptapEditor({ ...options, immediatelyRender: true }, deps)
}
