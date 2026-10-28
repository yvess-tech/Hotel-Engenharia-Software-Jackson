export function isDiscardAction(label: string, variant?: string) {
  return variant === "ghost" && /^(cancelar|fechar|voltar)$/i.test(label.trim())
}

// Only suppress a repeated activation of the same action; validation failures
// remain retryable and different actions never share a submission lock.
export function createActivationGuard(interval = 400) {
  let lastTarget: unknown
  let lastTime = -Infinity
  return (target: unknown, time: number) => {
    if (target === lastTarget && time - lastTime < interval) return false
    lastTarget = target
    lastTime = time
    return true
  }
}

export function dialogFocusBoundary<T>(
  current: T | null,
  fields: T[],
  backwards: boolean,
) {
  if (!fields.length) return null
  if (!fields.includes(current as T))
    return backwards ? fields[fields.length - 1] : fields[0]
  if (backwards && current === fields[0]) return fields[fields.length - 1]
  if (!backwards && current === fields[fields.length - 1]) return fields[0]
  return null
}
