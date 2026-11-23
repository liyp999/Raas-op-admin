import { onBeforeUnmount, onMounted, ref, type Ref } from 'vue'

/**
 * 表格横向可滚动的「边缘渐隐」提示。
 * 规则：有溢出且未滚到末尾时显示遮罩，滚到末尾即隐藏，避免遮住最后一列。
 */
export function useTableEdge(wrap: Ref<HTMLElement | null>) {
  const showEdge = ref(false)
  const showStart = ref(false)
  let scroller: HTMLElement | null = null
  let ro: ResizeObserver | null = null
  let mo: MutationObserver | null = null

  function measure() {
    if (!scroller) return
    const max = scroller.scrollWidth - scroller.clientWidth
    showEdge.value = max > 4 && scroller.scrollLeft < max - 4
    showStart.value = scroller.scrollLeft > 4
  }

  function bind() {
    const next = wrap.value?.querySelector('.n-scrollbar-container') as HTMLElement | null
    if (!next) return
    if (next !== scroller) {
      scroller?.removeEventListener('scroll', measure)
      scroller = next
      scroller.addEventListener('scroll', measure, { passive: true })
      ro?.disconnect()
      ro = new ResizeObserver(measure)
      ro.observe(scroller)
      mo?.disconnect()
      mo = new MutationObserver(measure)
      mo.observe(scroller, { childList: true, subtree: true })
    }
    measure()
  }

  onMounted(() => {
    bind()
    window.addEventListener('resize', bind)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', bind)
    scroller?.removeEventListener('scroll', measure)
    ro?.disconnect()
    mo?.disconnect()
    scroller = null
  })

  return { showEdge, showStart, refresh: bind }
}
