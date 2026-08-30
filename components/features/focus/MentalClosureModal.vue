<script setup lang="ts">
import { useFocusStore } from '~/stores/useFocusStore'
import { useTaskStore } from '~/stores/useTaskStore'
import AppModal from '~/components/ui/AppModal.vue'

const focusStore = useFocusStore()
const taskStore = useTaskStore()
const router = useRouter()

const offloadNote = ref('')
const isSubmitting = ref(false)

// Select Task modal inside closure flow
const showNextTaskSelector = ref(false)

const taskTitle = computed(() => focusStore.closureTaskData?.title || focusStore.activeTaskTitle || 'Focus Task')
const sessionMinutes = computed(() => focusStore.closureTaskData?.sessionMinutes || Math.max(1, Math.round(focusStore.durationSeconds / 60)))

function resetForm() {
  offloadNote.value = ''
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
          <div class="w-7 h-7 rounded-full bg-primary/15 text-primary flex items-center justify-center">
            <Icon name="material-symbols:check-circle" class="text-[18px]" />
          </div>
          <span class="text-xs font-extrabold uppercase tracking-wider text-primary">Task Finished</span>
        </div>
      </template>

      <div class="space-y-4 text-on-surface">
        <!-- 1-Line Offload Input -->
        <div>
          <input
            id="closure-offload-note"
            v-model="offloadNote"
            type="text"
            placeholder="Any leftover thoughts or next steps? (Optional)"
            class="w-full px-3.5 py-2.5 bg-surface border border-surface-variant rounded-xl text-xs sm:text-sm text-on-surface placeholder:text-outline/60 focus:outline-none focus:border-primary transition-colors"
          />
        </div>

        <!-- 2 Primary Action Buttons -->
        <div class="space-y-2 pt-1">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              @click="finalizeClosure('nextTask')"
              :disabled="isSubmitting"
              class="w-full py-2.5 px-4 bg-primary text-on-primary font-bold rounded-xl shadow-xs hover:bg-primary-container transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98 cursor-pointer"
            >
              <Icon name="material-symbols:bolt" class="text-[18px]" />
              <span>Anchor Next Task</span>
            </button>

            <button
              @click="finalizeClosure('break')"
              :disabled="isSubmitting"
              class="w-full py-2.5 px-4 bg-secondary text-on-secondary font-bold rounded-xl shadow-xs hover:opacity-90 transition-all flex items-center justify-center gap-2 text-xs sm:text-sm active:scale-98 cursor-pointer"
            >
              <Icon name="material-symbols:local-cafe" class="text-[18px]" />
              <span>Take 5m Break</span>
            </button>
          </div>

          <div class="flex items-center justify-center gap-4 pt-1">
            <button
              @click="finalizeClosure('matrix')"
              :disabled="isSubmitting"
              class="text-xs font-semibold text-on-surface-variant hover:text-primary transition-colors py-1 px-2.5 rounded-lg hover:bg-surface-container-low cursor-pointer flex items-center gap-1"
            >
              <Icon name="material-symbols:grid-view" class="text-[14px]" />
              <span>Priority Matrix</span>
            </button>

            <span class="text-outline/30">•</span>

            <button
              @click="finalizeClosure('done')"
              :disabled="isSubmitting"
              class="text-xs font-semibold text-outline hover:text-on-surface transition-colors py-1 px-2.5 rounded-lg hover:bg-surface-container-low cursor-pointer flex items-center gap-1"
            >
              <Icon name="material-symbols:check" class="text-[14px]" />
              <span>Just Finish Task</span>
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
