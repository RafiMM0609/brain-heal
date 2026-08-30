<script setup lang="ts">
import { useFocusStore } from '~/stores/useFocusStore'
import { useTaskStore } from '~/stores/useTaskStore'
import AppModal from '~/components/ui/AppModal.vue'

const focusStore = useFocusStore()
const taskStore = useTaskStore()
const router = useRouter()

const offloadNote = ref('')
const selectedEnergyState = ref<'high' | 'balanced' | 'drained'>('balanced')
const isSubmitting = ref(false)

// Select Task modal inside closure flow
const showNextTaskSelector = ref(false)

const taskTitle = computed(() => focusStore.closureTaskData?.title || focusStore.activeTaskTitle || 'Focus Task')
const sessionMinutes = computed(() => focusStore.closureTaskData?.sessionMinutes || Math.max(1, Math.round(focusStore.durationSeconds / 60)))

function resetForm() {
  offloadNote.value = ''
  selectedEnergyState.value = 'balanced'
  showNextTaskSelector.value = false
  isSubmitting.value = false
}

watch(() => focusStore.isMentalClosureOpen, (val) => {
  if (val) {
    resetForm()
  }
})

async function finalizeClosure(action: 'nextTask' | 'break' | 'matrix' | 'done') {
  isSubmitting.value = true

  const activeId = focusStore.closureTaskData?.id || focusStore.activeTaskId

  // 1. Mark task completed in task store if active task exists
  if (activeId) {
    await taskStore.toggleTaskComplete(activeId)
  }

  // 2. Save offload note to Raw Inbox if provided (Zeigarnik loop offload)
  if (offloadNote.value.trim()) {
    await taskStore.addTask(`[From ${taskTitle.value}] ${offloadNote.value.trim()}`, 'inbox')
  }

  // 3. Clear active focus task in focus store
  focusStore.activeTaskId = null
  focusStore.activeTaskTitle = ''

  // 4. Handle navigation & action
  focusStore.closeMentalClosure()
  isSubmitting.value = false

  if (action === 'break') {
    focusStore.setMode('shortBreak', 5)
    focusStore.startTimer()
    router.push('/execute')
  } else if (action === 'nextTask') {
    showNextTaskSelector.value = true
  } else if (action === 'matrix') {
    router.push('/')
  }
}

function selectNextTask(id: string, title: string) {
  focusStore.setFocusTask(id, title)
  showNextTaskSelector.value = false
  focusStore.setMode('work', 25)
  router.push('/execute')
}
</script>

<template>
  <div>
    <!-- Primary Mental Closure Modal -->
    <AppModal
      :isOpen="focusStore.isMentalClosureOpen"
      @close="focusStore.closeMentalClosure()"
    >
      <template #header>
        <div class="flex items-center gap-2">
          <div class="w-7 h-7 rounded-full bg-secondary/15 text-secondary flex items-center justify-center">
            <Icon name="material-symbols:psychology" class="text-[18px]" />
          </div>
          <span class="text-xs font-extrabold uppercase tracking-wider text-secondary">Mental Closure</span>
        </div>
      </template>

      <div class="space-y-6 text-on-surface">
        <!-- Step 1: Dopamine Burst & Victory Banner -->
        <div class="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/10 to-transparent p-5 border border-primary/20 text-center">
          <!-- Background Ambient Glow -->
          <div class="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl pointer-events-none" />

          <!-- Animated Badge -->
          <div class="relative z-10 mx-auto w-16 h-16 rounded-full bg-primary text-on-primary flex items-center justify-center shadow-lg mb-3 animate-bounce">
            <Icon name="material-symbols:check-circle" class="text-[36px]" />
          </div>

          <h3 class="text-xl sm:text-2xl font-extrabold text-on-surface leading-tight mb-1">
            Task Finished & Sealed! 🎉
          </h3>
          <p class="text-sm font-semibold text-primary max-w-sm mx-auto line-clamp-2">
            "{{ taskTitle }}"
          </p>

          <div class="mt-4 inline-flex items-center gap-3 px-3.5 py-1.5 bg-surface-bright/90 backdrop-blur-md border border-surface-variant rounded-full text-xs font-bold text-on-surface shadow-xs">
            <span class="flex items-center gap-1 text-primary">
              <Icon name="material-symbols:timer" class="text-[16px]" />
              {{ sessionMinutes }}m Focused
            </span>
            <span class="text-outline/40">•</span>
            <span class="flex items-center gap-1 text-secondary">
              <Icon name="material-symbols:bolt" class="text-[16px]" />
              +2 Battery Pts
            </span>
          </div>
        </div>

        <!-- Step 2: Zeigarnik Effect Offloading (Micro Brain Dump) -->
        <div class="bg-surface-container-low rounded-xl p-4 border border-surface-variant space-y-2">
          <div class="flex items-center justify-between">
            <label for="closure-offload-note" class="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <Icon name="material-symbols:cloud-upload" class="text-[16px] text-primary" />
              <span>Working Memory Offload (Optional)</span>
            </label>
            <span class="text-[10px] text-outline font-medium">Zeigarnik Shield</span>
          </div>

          <p class="text-xs text-on-surface-variant leading-relaxed">
            Record any leftover thoughts, next actions, or key takeaways before your prefrontal cortex fully releases this task context.
          </p>

          <textarea
            id="closure-offload-note"
            v-model="offloadNote"
            rows="2"
            placeholder="e.g. Next session: Send draft to client for review..."
            class="w-full p-2.5 bg-surface border border-surface-variant rounded-lg text-xs sm:text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary transition-colors resize-none"
          />
        </div>

        <!-- Step 3: Subjective Cognitive Energy Check-in -->
        <div class="space-y-2">
          <label class="text-xs font-bold text-on-surface flex items-center gap-1.5">
            <Icon name="material-symbols:battery-charging-90" class="text-[16px] text-secondary" />
            <span>How does your brain feel right now?</span>
          </label>

          <div class="grid grid-cols-3 gap-2">
            <button
              type="button"
              @click="selectedEnergyState = 'high'"
              class="p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer"
              :class="selectedEnergyState === 'high' ? 'bg-primary/10 border-primary text-primary font-bold shadow-xs' : 'bg-surface border-surface-variant text-on-surface-variant hover:bg-surface-container-low'"
            >
              <span class="text-lg">⚡</span>
              <span class="text-[11px]">High Energy</span>
            </button>

            <button
              type="button"
              @click="selectedEnergyState = 'balanced'"
              class="p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer"
              :class="selectedEnergyState === 'balanced' ? 'bg-secondary/10 border-secondary text-secondary font-bold shadow-xs' : 'bg-surface border-surface-variant text-on-surface-variant hover:bg-surface-container-low'"
            >
              <span class="text-lg">🌿</span>
              <span class="text-[11px]">Balanced</span>
            </button>

            <button
              type="button"
              @click="selectedEnergyState = 'drained'"
              class="p-2.5 rounded-xl border text-center transition-all flex flex-col items-center gap-1 cursor-pointer"
              :class="selectedEnergyState === 'drained' ? 'bg-error/10 border-error text-error font-bold shadow-xs' : 'bg-surface border-surface-variant text-on-surface-variant hover:bg-surface-container-low'"
            >
              <span class="text-lg">🪫</span>
              <span class="text-[11px]">Drained</span>
            </button>
          </div>
        </div>

        <!-- Step 4: Mindful Next Step Decision Actions -->
        <div class="pt-2 space-y-2">
          <p class="text-[11px] font-extrabold uppercase tracking-wider text-outline text-center">
            Choose Your Mindful Transition
          </p>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              @click="finalizeClosure('nextTask')"
              :disabled="isSubmitting"
              class="w-full py-3 px-4 bg-primary text-on-primary font-bold rounded-xl shadow-md hover:bg-primary-container transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98"
            >
              <Icon name="material-symbols:bolt" class="text-[18px]" />
              <span>Anchor Next Task</span>
            </button>

            <button
              @click="finalizeClosure('break')"
              :disabled="isSubmitting"
              class="w-full py-3 px-4 bg-secondary text-on-secondary font-bold rounded-xl shadow-md hover:opacity-90 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98"
            >
              <Icon name="material-symbols:local-cafe" class="text-[18px]" />
              <span>Take a Break (5m)</span>
            </button>
          </div>

          <div class="flex items-center justify-center gap-4 pt-1">
            <button
              @click="finalizeClosure('matrix')"
              :disabled="isSubmitting"
              class="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors py-1 px-2"
            >
              Return to Priority Matrix
            </button>

            <span class="text-outline/30">•</span>

            <button
              @click="finalizeClosure('done')"
              :disabled="isSubmitting"
              class="text-xs font-semibold text-outline hover:text-on-surface transition-colors py-1 px-2"
            >
              Just Close Modal
            </button>
          </div>
        </div>
      </div>
    </AppModal>

    <!-- Secondary Modal: Select Next Task -->
    <AppModal
      :isOpen="showNextTaskSelector"
      title="Select Next Focus Anchor"
      @close="showNextTaskSelector = false"
    >
      <div class="space-y-3">
        <p class="text-xs text-on-surface-variant mb-3">
          Select an available task from your Priority Engine to maintain seamless focus:
        </p>

        <div v-if="taskStore.tasks.filter(t => !t.completed).length === 0" class="text-center py-6 text-outline text-sm">
          No remaining uncompleted tasks! Create new tasks in Priority Matrix.
        </div>

        <div
          v-for="task in taskStore.tasks.filter(t => !t.completed)"
          :key="task.id"
          @click="selectNextTask(task.id, task.title)"
          class="p-3.5 bg-surface-container-low rounded-xl border border-surface-variant hover:border-primary/50 cursor-pointer flex items-center justify-between group transition-all"
        >
          <div class="flex items-center gap-3">
            <Icon name="material-symbols:play-circle-outline" class="text-primary text-[22px] group-hover:scale-110 transition-transform" />
            <div>
              <h4 class="font-bold text-on-surface text-sm">{{ task.title }}</h4>
              <span class="text-[10px] text-outline uppercase font-medium">Quadrant: {{ task.quadrant }}</span>
            </div>
          </div>
          <span class="text-xs font-bold text-primary px-2.5 py-1 bg-primary/10 rounded-lg group-hover:bg-primary group-hover:text-on-primary transition-colors">
            Start Focus
          </span>
        </div>
      </div>
    </AppModal>
  </div>
</template>
