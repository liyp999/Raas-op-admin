import { onBeforeUnmount, onMounted, ref } from 'vue'

/** 视口匹配（默认 ≤1200px 判为紧凑），用于表格列自适应 */
export function useCompactViewport(query = '(max-width: 1300px)') {
  const compact = ref(false)
  let mql: MediaQueryList | null = null

  function onChange(event: MediaQueryListEvent) {
    compact.value = event.matches
  }

  onMounted(() => {
    mql = window.matchMedia(query)
    compact.value = mql.matches
    mql.addEventListener('change', onChange)
  })

  onBeforeUnmount(() => {
    mql?.removeEventListener('change', onChange)
    mql = null
  })

  return { compact }
}
