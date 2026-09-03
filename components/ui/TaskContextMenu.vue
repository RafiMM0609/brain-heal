<script setup lang="ts">
import type { QuadrantType, TaskItem } from '~/types/task'

const props = withDefaults(
  defineProps<{
    show: boolean
    x: number
    y: number
    task: TaskItem | null
    allowFocus?: boolean
  }>(),
  {
    allowFocus: true
  }
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'move', quadrant: QuadrantType): void
  (e: 'focus'): void
  (e: 'detail'): void
  (e: 'complete'): void
  (e: 'delete'): void
}>()

const menuRef = ref<HTMLElement | null>(null)
const adjustedX = ref(0)
const adjustedY = ref(0)
const isMobile = ref(false)

function checkScreenSize() {
  if (typeof window !== 'undefined') {
    isMobile.value = window.innerWidth < 640 || ('ontouchstart' in window && window.innerWidth < 768)
  }
}

const quadrantsList: Array<{
  id: QuadrantType
  label: string
  subtitle: string
  icon: string
  activeColorClass: string
  iconColorClass: string
}> = [
  {
    id: 'do-first',
    label: 'Do First',
    subtitle: 'Urgent & Important',
    icon: 'material-symbols:bolt',
    activeColorClass: 'bg-error-container/30 text-error font-semibold',
    iconColorClass: 'text-error'
  },
  {
    id: 'schedule',
    label: 'Schedule',
    subtitle: 'Not Urgent & High Impact',
    icon: 'material-symbols:calendar-today',
    activeColorClass: 'bg-primary-container/30 text-primary font-semibold',
    iconColorClass: 'text-primary'
  },
  {
    id: 'delegate',
    label: 'Delegate',
    subtitle: 'Urgent & Low Impact',
    icon: 'material-symbols:group',
    activeColorClass: 'bg-surface-container-highest text-on-surface font-semibold',
    iconColorClass: 'text-on-primary-container'
  },
  {
    id: 'eliminate',
    label: 'Eliminate',
    subtitle: 'Low Urgency & Low Impact',
    icon: 'material-symbols:block',
    activeColorClass: 'bg-surface-container-high text-outline font-semibold',
    iconColorClass: 'text-outline'
  },
  {
    id: 'inbox',
    label: 'Raw Inbox',
    subtitle: 'Unsorted capture',
    icon: 'material-symbols:inbox',
    activeColorClass: 'bg-surface-container-high text-on-surface font-semibold',
    iconColorClass: 'text-outline-variant'
  }
]

function updatePosition() {
  if (!props.show || isMobile.value) return

  nextTick(() => {
    const padding = 12
    const windowWidth = typeof window !== 'undefined' ? window.innerWidth : 1000
    const windowHeight = typeof window !== 'undefined' ? window.innerHeight : 800

    let posX = props.x
    let posY = props.y

    if (menuRef.value) {
      const menuWidth = menuRef.value.offsetWidth || 256
      const menuHeight = menuRef.value.offsetHeight || 320

      if (posX + menuWidth > windowWidth - padding) {
        posX = Math.max(padding, windowWidth - menuWidth - padding)
      }
      if (posY + menuHeight > windowHeight - padding) {
        posY = Math.max(padding, windowHeight - menuHeight - padding)
      }
    }

    adjustedX.value = posX
    adjustedY.value = posY
  })
}

watch(
  () => [props.show, props.x, props.y],
  () => {
    if (props.show) {
      checkScreenSize()
      updatePosition()
    }
  },
  { immediate: true }
)

function handleOutsideClick(event: MouseEvent) {
  if (!props.show) return
  if (menuRef.value && !menuRef.value.contains(event.target as Node)) {
    emit('close')
  }
}

function handleKeyDown(event: KeyboardEvent) {
  if (event.key === 'Escape' && props.show) {
    emit('close')
  }
}

function handleScroll() {
  if (props.show && !isMobile.value) {
    emit('close')
  }
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    window.addEventListener('mousedown', handleOutsideClick)
    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('scroll', handleScroll, true)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('resize', checkScreenSize)
    window.removeEventListener('mousedown', handleOutsideClick)
    window.removeEventListener('keydown', handleKeyDown)
    window.removeEventListener('scroll', handleScroll, true)
  }
})

function selectQuadrant(quadrant: QuadrantType) {
  emit('move', quadrant)
  emit('close')
}

function triggerFocus() {
  emit('focus')
  emit('close')
}

function triggerDetail() {
  emit('detail')
  emit('close')
}

function triggerComplete() {
  emit('complete')
  emit('close')
}

function triggerDelete() {
  emit('delete')
  emit('close')
}
</script>

<template>
  <Teleport to="body">
    <!-- Backdrop overlay on Mobile Sheet -->
    <Transition
      enter-active-class="transition-opacity duration-200 ease-out"
      enter-from-class="opacity-0"
      enter-to-class="opacity-100"
      leave-active-class="transition-opacity duration-150 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="show && task && isMobile"
        @click="emit('close')"
        class="fixed inset-0 z-[9998] bg-black/60 backdrop-blur-xs"
        aria-hidden="true"
      />
    </Transition>

    <!-- Desktop Floating Menu & Mobile Action Sheet -->
    <Transition
      :enter-active-class="isMobile ? 'transition duration-300 cubic-bezier(0.16, 1, 0.3, 1)' : 'transition duration-150 ease-out'"
      :enter-from-class="isMobile ? 'translate-y-full opacity-0' : 'opacity-0 scale-95'"
      :enter-to-class="isMobile ? 'translate-y-0 opacity-100' : 'opacity-100 scale-100'"
      :leave-active-class="isMobile ? 'transition duration-200 ease-in' : 'transition duration-100 ease-in'"
      :leave-from-class="isMobile ? 'translate-y-0 opacity-100' : 'opacity-100 scale-100'"
      :leave-to-class="isMobile ? 'translate-y-full opacity-0' : 'opacity-0 scale-95'"
    >
      <div
        v-if="show && task"
        ref="menuRef"
        :style="!isMobile ? { top: `${adjustedY}px`, left: `${adjustedX}px` } : {}"
        :class="[
          isMobile
            ? 'fixed bottom-0 left-0 right-0 z-[9999] w-full bg-surface-bright/95 backdrop-blur-2xl rounded-t-3xl border-t border-surface-variant p-4 pb-safe shadow-2xl overflow-hidden text-on-surface select-none outline-none'
            : 'fixed z-[9999] w-64 bg-surface-bright/95 backdrop-blur-md border border-surface-variant shadow-2xl rounded-2xl p-2 text-on-surface select-none outline-none overflow-hidden'
        ]"
        @contextmenu.prevent
      >
        <!-- Drag indicator pill for mobile action sheet -->
        <div v-if="isMobile" class="w-12 h-1.5 bg-outline-variant/60 rounded-full mx-auto mb-3" />

        <!-- Task Header Title -->
        <div class="px-3 py-2 border-b border-surface-variant/60 mb-2">
          <div class="text-[10px] font-bold uppercase tracking-wider text-outline mb-0.5 flex items-center justify-between">
            <span>Organize Task</span>
            <span class="px-2 py-0.5 bg-surface-container-high rounded text-[10px] font-mono capitalize">
              {{ task.quadrant }}
            </span>
          </div>
          <p class="text-sm font-semibold text-on-surface truncate" :title="task.title">
            {{ task.title }}
          </p>
        </div>

        <!-- Quadrant Priority Engine Options -->
        <div class="space-y-1">
          <button
            v-for="q in quadrantsList"
            :key="q.id"
            @click="selectQuadrant(q.id)"
            class="w-full rounded-xl text-left flex items-center justify-between group hover:bg-surface-container-high active:scale-[0.98] transition-all"
            :class="[
              isMobile ? 'px-3 py-2.5' : 'px-2.5 py-1.5',
              task.quadrant === q.id ? q.activeColorClass : 'text-on-surface-variant'
            ]"
          >
            <div class="flex items-center gap-3 min-w-0">
              <div
                class="rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                :class="[
                  isMobile ? 'w-8 h-8' : 'w-6 h-6',
                  task.quadrant === q.id ? 'bg-surface-bright shadow-xs' : 'bg-surface-container-low'
                ]"
              >
                <Icon :name="q.icon" :class="[isMobile ? 'text-[18px]' : 'text-[16px]', q.iconColorClass]" />
              </div>
              <div class="min-w-0">
                <div class="font-medium leading-tight flex items-center gap-1.5" :class="isMobile ? 'text-sm' : 'text-xs'">
                  <span>{{ q.label }}</span>
                  <span v-if="task.quadrant === q.id" class="text-[11px] font-normal text-primary">✓</span>
                </div>
                <div class="text-[10px] text-outline truncate mt-0.5">
                  {{ q.subtitle }}
                </div>
              </div>
            </div>
          </button>
        </div>

        <!-- Cancel button for mobile action sheet -->
        <button
          v-if="isMobile"
          @click="emit('close')"
          class="w-full mt-3 py-2.5 rounded-xl bg-surface-container-high text-on-surface font-semibold text-sm transition-all active:scale-[0.98]"
        >
          Cancel
        </button>
      </div>
    </Transition>
  </Teleport>
</template>
