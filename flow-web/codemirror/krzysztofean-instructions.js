import {EditorView} from '@codemirror/view'
import {HighlightStyle, syntaxHighlighting} from '@codemirror/language'
import {tags} from "@lezer/highlight";

const theme = {
    ".cm-scroller": {
        "overflow": "auto"
    },
    ".cm-wrap": {
        "height": "100%"
    },
    "&": {
        "fontSize": "12pt",
        "backgroundColor": "#151515",
        "color": "#ffffff"
    },
    ".cm-content": {
        "fontFamily": '"JetBrains Mono", monospace',
        "caretColor": "#ffffff"
    },
    "&.cm-focused .cm-cursor": {
        "borderLeftColor": "#ffffff"
    },
    "&.cm-focused .cm-selectionBackground, ::selection": {
        "backgroundColor": "#303030"
    },
    ".cm-activeLine": {
        "backgroundColor": "#191919"
    },
    ".cm-searchMatch": {
        "backgroundColor": "#72a1ff"
    },
    ".cm-gutters": {
        "backgroundColor": "#0a0a0a",
        "color": "#b4b4b4",
        "borderColor": "#1a1a1a"
    },
    ".cm-gutterElement": {
        "backgroundColor": "#0a0a0a"
    }
}
const highlightStyles = HighlightStyle.define([
    {
        tag: [tags.keyword],
        color: "#0096e6"
    },
    {
        tag: [tags.string],
        color: "#00e9b8"
    },
    {
        tag: [tags.function(tags.variableName), tags.number],
        color: "#fcffb4"
    },
    {
        tag: [tags.variableName],
        color: "#6ce0cf"
    },
    {
        tag: [tags.operator],
        color: "#5bd8ff"
    },
    {
        tag: [tags.annotation],
        color: "#5bd8ff"
    },
    {
        tag: [tags.typeName],
        color: "#00ff82"
    },
    {
        tag: [tags.className],
        color: "#00ff82"
    },
    {
        tag: [tags.squareBracket],
        color: "#c9c9c9"
    },
    {
        tag: [tags.angleBracket],
        color: "#c9c9c9"
    },
])

export const krzysztofeanInstructions = [
    EditorView.theme(theme, {dark: true}),
    syntaxHighlighting(highlightStyles)
]