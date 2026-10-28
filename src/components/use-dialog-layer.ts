import { createElement, useEffect, useId, useRef, type ReactNode } from "react"
import { createPortal } from "react-dom"
import { dialogFocusBoundary } from "./dialog-rules"

type Layer = { overlay: HTMLDivElement; dialog: HTMLDivElement }
const layers: Layer[] = []
const originalInert = new Map<HTMLElement, boolean>()
let originalOverflow = ""
const originalZIndex = new Map<HTMLElement, string>()

// Existing guided presentations are explicit assistance surfaces, not ordinary
// background controls. Keep their handlers and positioning while a form is open.
export function DialogAssistant({ children }: { children: ReactNode }) {
  const id = useId()
  useEffect(() => {
    if (layers.length) refreshLayers()
    return () => {
      if (layers.length) refreshLayers()
    }
  }, [])
  return typeof document === "undefined"
    ? children
    : createPortal(
        createElement(
          "div",
          { id, className: "dialog-assistant", "data-dialog-assistant": "" },
          children,
        ),
        document.body,
      )
}

function refreshLayers() {
  const top = layers[layers.length - 1]
  if (!top) {
    for (const [element, inert] of originalInert) element.inert = inert
    originalInert.clear()
    for (const [element, zIndex] of originalZIndex)
      element.style.zIndex = zIndex
    originalZIndex.clear()
    document.body.style.overflow = originalOverflow
    return
  }
  for (const element of document.body.children) {
    if (!(element instanceof HTMLElement)) continue
    if (!originalInert.has(element)) originalInert.set(element, element.inert)
    const assistant =
      element.hasAttribute("data-dialog-assistant") &&
      top.dialog.getAttribute("role") !== "alertdialog"
    element.inert = element !== top.overlay && !assistant
    if (assistant) {
      if (!originalZIndex.has(element))
        originalZIndex.set(element, element.style.zIndex)
      element.style.zIndex = String(1000 + (layers.length - 1) * 20 + 10)
    }
  }
  layers.forEach((layer, index) => {
    layer.overlay.style.zIndex = String(1000 + index * 20)
  })
  const assistantIds = [
    ...document.querySelectorAll<HTMLElement>(
      "[data-dialog-assistant]:not([inert])",
    ),
  ]
    .map((element) => element.id)
    .filter(Boolean)
  if (assistantIds.length)
    top.dialog.setAttribute("aria-owns", assistantIds.join(" "))
  else top.dialog.removeAttribute("aria-owns")
}

export default function useDialogLayer(onClose: () => void) {
  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose)
  closeRef.current = onClose
  useEffect(() => {
    const overlay = overlayRef.current
    const dialog = dialogRef.current
    if (!overlay || !dialog) return
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null
    const layer = { overlay, dialog }
    if (!layers.length) originalOverflow = document.body.style.overflow
    layers.push(layer)
    document.body.style.overflow = "hidden"
    refreshLayers()
    dialog.focus({ preventScroll: true })
    const isTop = () => layers[layers.length - 1] === layer
    const onKey = (event: KeyboardEvent) => {
      if (!isTop() || event.defaultPrevented || event.isComposing) return
      if (
        event.key === "Escape" &&
        event.target instanceof Element &&
        event.target.closest("[data-dialog-assistant]")
      )
        return
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        closeRef.current()
      } else if (event.key === "Tab") {
        const selector =
          'button:not(:disabled), input:not(:disabled):not([type="hidden"]), select:not(:disabled), textarea:not(:disabled), a[href], [tabindex="0"], summary'
        const assistants = [
          ...document.querySelectorAll<HTMLElement>(
            "[data-dialog-assistant]:not([inert])",
          ),
        ]
        const fields = [dialog, ...assistants]
          .flatMap((region) => [
            ...region.querySelectorAll<HTMLElement>(selector),
          ])
          .filter(
            (element) =>
              element.tabIndex >= 0 &&
              element.getClientRects().length > 0 &&
              !element.closest("[inert]"),
          )
        const target = dialogFocusBoundary(
          document.activeElement as HTMLElement | null,
          fields,
          event.shiftKey,
        )
        if (target || !fields.length) {
          event.preventDefault()
          ;(target ?? dialog).focus()
        }
      }
    }
    const onFocus = (event: FocusEvent) => {
      if (
        isTop() &&
        event.target instanceof Node &&
        !dialog.contains(event.target)
      ) {
        const assistant =
          event.target instanceof Element
            ? event.target.closest("[data-dialog-assistant]:not([inert])")
            : null
        if (!assistant) dialog.focus({ preventScroll: true })
      }
    }
    document.addEventListener("keydown", onKey, true)
    document.addEventListener("focusin", onFocus, true)
    return () => {
      document.removeEventListener("keydown", onKey, true)
      document.removeEventListener("focusin", onFocus, true)
      const index = layers.indexOf(layer)
      if (index >= 0) layers.splice(index, 1)
      refreshLayers()
      const top = layers[layers.length - 1]
      if (
        previous?.isConnected &&
        !previous.closest("[inert]") &&
        (!top || top.dialog.contains(previous))
      )
        previous.focus({ preventScroll: true })
      else top?.dialog.focus({ preventScroll: true })
    }
  }, [])
  return { overlayRef, dialogRef }
}
