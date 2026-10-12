<script setup lang="ts">
import { computed } from 'vue'
import type { CompanionMood, CatTheme } from '~/types/companion'

const props = withDefaults(
  defineProps<{
    mood?: CompanionMood
    theme?: CatTheme
    width?: number | string
    height?: number | string
  }>(),
  {
    mood: 'idle',
    theme: 'orange',
    width: 200,
    height: 170
  }
)

// Dynamic Color Palettes for Cat Themes
const palette = computed(() => {
  switch (props.theme) {
    case 'white':
      return {
        body: '#FFFFFF',
        shadow: '#E2E6EA',
        belly: '#F8F9FA',
        earInner: '#FFCCD5',
        nose: '#FF8FAB',
        blush: '#FF85A1',
        eye: '#2B2D42',
        stripes: 'transparent',
        collar: '#3A86FF',
        bell: '#FFBE0B',
        desk: '#D8DEE9',
        laptop: '#4C566A'
      }
    case 'calico':
      return {
        body: '#FBF5EE',
        shadow: '#E5DCD3',
        belly: '#FFFFFF',
        earInner: '#FFAAA6',
        nose: '#FF8FAB',
        blush: '#FF758F',
        eye: '#2F3E46',
        stripes: '#E07A5F',
        patchDark: '#3D405B',
        collar: '#81B29A',
        bell: '#F2CC8F',
        desk: '#E2D9CE',
        laptop: '#545E75'
      }
    case 'black':
      return {
        body: '#262933',
        shadow: '#1A1C24',
        belly: '#353947',
        earInner: '#FF97B7',
        nose: '#FF7096',
        blush: '#FF5D8F',
        eye: '#FFD166',
        stripes: 'transparent',
        collar: '#EF476F',
        bell: '#FFD166',
        desk: '#454B5E',
        laptop: '#68728F'
      }
    case 'orange':
    default:
      return {
        body: '#FFAD60',
        shadow: '#E89041',
        belly: '#FFF3E3',
        earInner: '#FF9797',
        nose: '#E85D75',
        blush: '#FF6B8B',
        eye: '#22223B',
        stripes: '#D97724',
        collar: '#002446',
        bell: '#FFB703',
        desk: '#E3D7C7',
        laptop: '#4A5568'
      }
  }
})
</script>

<template>
  <div class="relative inline-block select-none pointer-events-none cat-svg-container">
    <svg
      :width="width"
      :height="height"
      viewBox="0 0 240 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      class="overflow-visible"
    >
      <!-- Definitions & Filters -->
      <defs>
        <!-- Soft Drop Shadow for Desk & Cat -->
        <filter id="cat-shadow" x="-10%" y="-10%" width="130%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="5" flood-opacity="0.12" flood-color="#000000" />
        </filter>
        <filter id="focus-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      <!-- Focus Mode Aura Glow -->
      <ellipse
        v-if="mood === 'focus'"
        cx="120"
        cy="105"
        rx="80"
        ry="65"
        fill="#002446"
        fill-opacity="0.08"
        class="animate-pulse"
      />

      <!-- ================= CAT BODY & BACK ================= -->
      <!-- Tail with smooth sway -->
      <g class="tail-group" :class="{ 'tail-wagging': mood === 'typing' || mood === 'petted' }">
        <path
          d="M 180 145 C 215 145 228 115 210 95 C 200 85 188 95 195 108 C 200 118 190 135 170 140 Z"
          :fill="palette.body"
          filter="url(#cat-shadow)"
        />
        <!-- Tail Tip / Stripe -->
        <path
          v-if="theme === 'orange' || theme === 'calico'"
          d="M 210 95 C 205 90 198 94 200 102 C 203 107 207 104 210 95 Z"
          :fill="palette.stripes || palette.belly"
        />
      </g>

      <!-- Main Body Base -->
      <ellipse
        cx="120"
        cy="142"
        rx="62"
        ry="42"
        :fill="palette.body"
        filter="url(#cat-shadow)"
        class="cat-breathing"
      />

      <!-- Calico Dark Back Patch -->
      <path
        v-if="theme === 'calico'"
        d="M 148 115 C 168 120 178 140 162 152 C 148 152 140 135 148 115 Z"
        :fill="palette.patchDark"
      />

      <!-- White Chest / Belly -->
      <ellipse
        cx="120"
        cy="148"
        rx="36"
        ry="28"
        :fill="palette.belly"
      />

      <!-- Collar with golden bell -->
      <path
        d="M 86 122 C 105 132 135 132 154 122"
        stroke="#e63946"
        stroke-width="4.5"
        stroke-linecap="round"
      />
      <circle cx="120" cy="129" r="4.5" :fill="palette.bell" />
      <circle cx="120" cy="129" r="1.5" fill="#B78103" />

      <!-- ================= CAT HEAD & EARS ================= -->
      <g class="cat-head-group">
        <!-- Left Ear -->
        <g class="ear-left" :class="{ 'ear-twitch': mood === 'typing' || mood === 'petted' }">
          <polygon points="72,82 62,32 100,56" :fill="palette.body" />
          <polygon points="74,77 68,41 95,58" :fill="palette.earInner" />
        </g>

        <!-- Right Ear -->
        <g class="ear-right" :class="{ 'ear-twitch-delayed': mood === 'typing' || mood === 'petted' }">
          <polygon points="168,82 178,32 140,56" :fill="palette.body" />
          <polygon points="166,77 172,41 145,58" :fill="palette.earInner" />
        </g>

        <!-- Calico Ear Patch -->
        <polygon
          v-if="theme === 'calico'"
          points="168,82 178,32 140,56"
          :fill="palette.stripes"
          opacity="0.9"
        />

        <!-- Cat Head Circle -->
        <circle
          cx="120"
          cy="86"
          r="48"
          :fill="palette.body"
          filter="url(#cat-shadow)"
        />

        <!-- Forehead Tabby Stripes -->
        <g v-if="theme === 'orange'" opacity="0.6">
          <path d="M 120 52 L 120 62" :stroke="palette.stripes" stroke-width="3" stroke-linecap="round" />
          <path d="M 112 55 L 115 63" :stroke="palette.stripes" stroke-width="2.5" stroke-linecap="round" />
          <path d="M 128 55 L 125 63" :stroke="palette.stripes" stroke-width="2.5" stroke-linecap="round" />
        </g>

        <!-- Calico Face Patch -->
        <path
          v-if="theme === 'calico'"
          d="M 145 60 C 160 70 162 90 148 98 C 136 94 135 72 145 60 Z"
          :fill="palette.stripes"
          opacity="0.85"
        />

        <!-- Cheeks / Snout muzzle -->
        <ellipse cx="112" cy="98" rx="10" ry="7" :fill="palette.belly" />
        <ellipse cx="128" cy="98" rx="10" ry="7" :fill="palette.belly" />

        <!-- Cute Blushing Cheeks -->
        <ellipse
          cx="88"
          cy="97"
          rx="9"
          ry="5.5"
          :fill="palette.blush"
          :opacity="mood === 'petted' ? '0.75' : '0.4'"
        />
        <ellipse
          cx="152"
          cy="97"
          rx="9"
          ry="5.5"
          :fill="palette.blush"
          :opacity="mood === 'petted' ? '0.75' : '0.4'"
        />

        <!-- Whiskers Left -->
        <g stroke="#9E9E9E" stroke-width="1.6" stroke-linecap="round" opacity="0.6">
          <line x1="72" y1="94" x2="94" y2="95" />
          <line x1="70" y1="101" x2="94" y2="100" />
        </g>
        <!-- Whiskers Right -->
        <g stroke="#9E9E9E" stroke-width="1.6" stroke-linecap="round" opacity="0.6">
          <line x1="146" y1="95" x2="168" y2="94" />
          <line x1="146" y1="100" x2="170" y2="101" />
        </g>

        <!-- Tiny Pink Nose -->
        <polygon points="116,92 124,92 120,96" :fill="palette.nose" />

        <!-- Cat Mouth ω -->
        <path
          d="M 113 97 Q 117 101 120 97 Q 123 101 127 97"
          stroke="#444444"
          stroke-width="1.8"
          stroke-linecap="round"
          fill="none"
        />

        <!-- ================= EYES LAYER ================= -->
        <!-- 1. Break / Sleep Mode: Peaceful curved eyes ◠ ◠ -->
        <g v-if="mood === 'break'" stroke="#333333" stroke-width="2.5" stroke-linecap="round" fill="none">
          <path d="M 98 84 Q 106 78 114 84" />
          <path d="M 126 84 Q 134 78 142 84" />
        </g>

        <!-- 2. Petted Mode: Blissful squint > < -->
        <g v-else-if="mood === 'petted'" stroke="#22223B" stroke-width="2.8" stroke-linecap="round" fill="none">
          <path d="M 97 86 L 105 81 L 113 86" />
          <path d="M 127 86 L 135 81 L 143 86" />
        </g>

        <!-- 2b. Held Mode: Wide cute kitten eyes O O -->
        <g v-else-if="mood === 'held'">
          <ellipse cx="104" cy="83" rx="9" ry="10" :fill="palette.eye" />
          <ellipse cx="136" cy="83" rx="9" ry="10" :fill="palette.eye" />
          <circle cx="102" cy="79" r="4" fill="#FFFFFF" />
          <circle cx="107" cy="85" r="1.8" fill="#FFFFFF" />
          <circle cx="134" cy="79" r="4" fill="#FFFFFF" />
          <circle cx="139" cy="85" r="1.8" fill="#FFFFFF" />
        </g>

        <!-- 3. Idle / Typing / Focus Normal Eye with Blink & Sparkle -->
        <g v-else class="cat-eyes-group" :class="{ 'cat-blinking': mood === 'idle' }">
          <!-- Left Eye Background -->
          <ellipse cx="104" cy="83" rx="7.5" ry="9" :fill="palette.eye" />
          <!-- Right Eye Background -->
          <ellipse cx="136" cy="83" rx="7.5" ry="9" :fill="palette.eye" />

          <!-- Left Eye Big Sparkle Highlight -->
          <circle cx="102" cy="80" r="3" fill="#FFFFFF" />
          <circle cx="106" cy="85" r="1.3" fill="#FFFFFF" />

          <!-- Right Eye Big Sparkle Highlight -->
          <circle cx="134" cy="80" r="3" fill="#FFFFFF" />
          <circle cx="138" cy="85" r="1.3" fill="#FFFFFF" />
        </g>

        <!-- ================= FOCUS GLASSES (Study Mode) ================= -->
        <g v-if="mood === 'focus'" class="focus-glasses" filter="url(#focus-glow)">
          <!-- Left Rim -->
          <circle cx="104" cy="83" r="12" stroke="#1A3A5F" stroke-width="2.2" fill="none" opacity="0.9" />
          <!-- Right Rim -->
          <circle cx="136" cy="83" r="12" stroke="#1A3A5F" stroke-width="2.2" fill="none" opacity="0.9" />
          <!-- Bridge -->
          <path d="M 116 82 Q 120 79 124 82" stroke="#1A3A5F" stroke-width="2.2" fill="none" stroke-linecap="round" />
          <!-- Temple lines -->
          <line x1="92" y1="82" x2="80" y2="78" stroke="#1A3A5F" stroke-width="1.8" stroke-linecap="round" />
          <line x1="148" y1="82" x2="160" y2="78" stroke="#1A3A5F" stroke-width="1.8" stroke-linecap="round" />
          <!-- Glint highlight reflection on lens -->
          <line x1="107" y1="76" x2="112" y2="81" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
          <line x1="139" y1="76" x2="144" y2="81" stroke="#FFFFFF" stroke-width="1.5" stroke-linecap="round" opacity="0.8" />
        </g>
      </g>

      <!-- ================= MINI DESK & LAPTOP / BONGO PAD ================= -->
      <g v-if="mood !== 'walking' && mood !== 'held'" class="desk-group">
        <!-- Modern Minimalist Desk Surface -->
        <rect
          x="42"
          y="152"
          width="156"
          height="18"
          rx="6"
          :fill="palette.desk"
          filter="url(#cat-shadow)"
        />
        <!-- Desk Edge Highlight -->
        <rect x="44" y="152" width="152" height="3" rx="1.5" fill="#FFFFFF" opacity="0.5" />

        <!-- Mini Laptop Base on Desk -->
        <rect
          x="88"
          y="150"
          width="64"
          height="14"
          rx="3"
          :fill="palette.laptop"
        />
        <!-- Laptop Keyboard Area -->
        <rect
          x="93"
          y="152"
          width="54"
          height="8"
          rx="1.5"
          fill="#2D3748"
        />
        <!-- Trackpad -->
        <rect x="114" y="161" width="12" height="2" rx="1" fill="#718096" />

        <!-- Tiny glowing laptop screen facing user/cat -->
        <path
          d="M 96 150 L 99 130 L 141 130 L 144 150 Z"
          fill="#334155"
          opacity="0.95"
        />
        <!-- Screen Glow Backlight -->
        <path
          d="M 101 148 L 103 133 L 137 133 L 139 148 Z"
          :fill="mood === 'focus' ? '#38BDF8' : '#60A5FA'"
          opacity="0.3"
        />
        <!-- Little Logo on back of screen (Paw symbol) -->
        <circle cx="120" cy="140" r="2.5" fill="#FFFFFF" opacity="0.85" />
        <circle cx="118" cy="136" r="1.1" fill="#FFFFFF" opacity="0.85" />
        <circle cx="122" cy="136" r="1.1" fill="#FFFFFF" opacity="0.85" />
      </g>

      <!-- ================= STEAMIN COFFEE MUG (Break Mode) ================= -->
      <g v-if="mood === 'break'" class="coffee-mug">
        <rect x="162" y="142" width="16" height="15" rx="3" fill="#E2E8F0" stroke="#CBD5E1" stroke-width="1.2" />
        <path d="M 178 146 Q 183 149 178 153" stroke="#CBD5E1" stroke-width="1.8" fill="none" />
        <!-- Steaming aroma waves -->
        <path
          d="M 166 138 Q 164 133 167 128"
          stroke="#94A3B8"
          stroke-width="1.4"
          fill="none"
          stroke-linecap="round"
          class="steam-wave"
        />
        <path
          d="M 172 138 Q 175 133 172 127"
          stroke="#94A3B8"
          stroke-width="1.4"
          fill="none"
          stroke-linecap="round"
          class="steam-wave-delayed"
        />
      </g>

      <!-- Hind Paws (Visible when walking or held) -->
      <g v-if="mood === 'walking' || mood === 'held'" class="hind-paws">
        <ellipse cx="98" cy="162" rx="9" ry="6" :fill="palette.belly" filter="url(#cat-shadow)" />
        <ellipse cx="142" cy="162" rx="9" ry="6" :fill="palette.belly" filter="url(#cat-shadow)" />
      </g>

      <!-- ================= BONGO / WALKING / DANGLING PAWS ================= -->
      <!-- Left Paw -->
      <g
        class="paw-left"
        :class="{
          'paw-bongo-left': mood === 'typing',
          'paw-focus-active': mood === 'focus',
          'paw-petted-up': mood === 'petted',
          'paw-walk-left': mood === 'walking',
          'paw-held-dangle-left': mood === 'held'
        }"
      >
        <ellipse cx="86" cy="148" rx="9" ry="7" :fill="palette.belly" filter="url(#cat-shadow)" />
        <ellipse cx="86" cy="148" rx="5" ry="3.5" :fill="palette.earInner" opacity="0.7" />
      </g>

      <!-- Right Paw -->
      <g
        class="paw-right"
        :class="{
          'paw-bongo-right': mood === 'typing',
          'paw-focus-active-delayed': mood === 'focus',
          'paw-petted-up': mood === 'petted',
          'paw-walk-right': mood === 'walking',
          'paw-held-dangle-right': mood === 'held'
        }"
      >
        <ellipse cx="154" cy="148" rx="9" ry="7" :fill="palette.belly" filter="url(#cat-shadow)" />
        <ellipse cx="154" cy="148" rx="5" ry="3.5" :fill="palette.earInner" opacity="0.7" />
      </g>

      <!-- ================= FLOATING AMBIENT PARTICLES ================= -->
      <!-- Sleep Zzz Particles (Break Mode) -->
      <g v-if="mood === 'break'" class="zzz-particles">
        <text x="146" y="60" font-family="monospace" font-weight="bold" font-size="14" fill="#64748B" class="zzz-1">z</text>
        <text x="158" y="44" font-family="monospace" font-weight="bold" font-size="18" fill="#64748B" class="zzz-2">Z</text>
        <text x="172" y="26" font-family="monospace" font-weight="bold" font-size="22" fill="#475569" class="zzz-3">Z</text>
      </g>

      <!-- Typing Sparkles -->
      <g v-if="mood === 'typing'" class="sparkle-particles">
        <text x="70" y="135" font-size="12" class="sparkle-1">✨</text>
        <text x="165" y="135" font-size="12" class="sparkle-2">✨</text>
      </g>

      <!-- Celebration Sparkles -->
      <g v-if="mood === 'celebrate'" class="celebration-particles">
        <text x="60" y="60" font-size="18" class="sparkle-1">🎉</text>
        <text x="160" y="55" font-size="18" class="sparkle-2">⭐</text>
        <text x="110" y="25" font-size="16" class="sparkle-3">✨</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
/* Compositor-friendly smooth keyframe animations */

/* Breathing idle body */
.cat-breathing {
  transform-origin: 120px 145px;
  animation: breathe 3.6s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.02, 0.98);
  }
}

/* Eye Blinking */
.cat-blinking {
  transform-origin: 120px 83px;
  animation: blink 4.2s infinite;
}

@keyframes blink {
  0%, 94%, 98%, 100% {
    transform: scaleY(1);
  }
  96% {
    transform: scaleY(0.08);
  }
}

/* Tail Swaying */
.tail-group {
  transform-origin: 180px 145px;
  animation: tailSway 3s ease-in-out infinite;
}

.tail-wagging {
  animation: tailWagFast 0.6s ease-in-out infinite !important;
}

@keyframes tailSway {
  0%, 100% {
    transform: rotate(0deg);
  }
  50% {
    transform: rotate(-6deg);
  }
}

@keyframes tailWagFast {
  0%, 100% {
    transform: rotate(4deg);
  }
  50% {
    transform: rotate(-10deg);
  }
}

/* Ear Twitching */
.ear-twitch {
  transform-origin: 74px 77px;
  animation: earTwitchLeft 1.2s ease-in-out infinite;
}

.ear-twitch-delayed {
  transform-origin: 166px 77px;
  animation: earTwitchRight 1.2s ease-in-out infinite;
  animation-delay: 0.2s;
}

@keyframes earTwitchLeft {
  0%, 80%, 100% {
    transform: rotate(0deg);
  }
  85% {
    transform: rotate(-6deg);
  }
}

@keyframes earTwitchRight {
  0%, 80%, 100% {
    transform: rotate(0deg);
  }
  85% {
    transform: rotate(6deg);
  }
}

/* BONGO PAWS: Rapid alternating tapping */
.paw-bongo-left {
  transform-origin: 86px 148px;
  animation: bongoTapLeft 0.16s ease-in-out infinite alternate;
}

.paw-bongo-right {
  transform-origin: 154px 148px;
  animation: bongoTapRight 0.16s ease-in-out infinite alternate;
  animation-delay: 0.08s;
}

@keyframes bongoTapLeft {
  0% {
    transform: translateY(-8px) scale(1.05);
  }
  100% {
    transform: translateY(2px) scale(0.95);
  }
}

@keyframes bongoTapRight {
  0% {
    transform: translateY(2px) scale(0.95);
  }
  100% {
    transform: translateY(-8px) scale(1.05);
  }
}

/* Focus Paws: rhythmic steady tapping */
.paw-focus-active {
  transform-origin: 86px 148px;
  animation: focusTapLeft 0.5s ease-in-out infinite alternate;
}

.paw-focus-active-delayed {
  transform-origin: 154px 148px;
  animation: focusTapRight 0.5s ease-in-out infinite alternate;
  animation-delay: 0.25s;
}

@keyframes focusTapLeft {
  0% {
    transform: translateY(-4px);
  }
  100% {
    transform: translateY(0px);
  }
}

@keyframes focusTapRight {
  0% {
    transform: translateY(0px);
  }
  100% {
    transform: translateY(-4px);
  }
}

/* Petted Joyful Paws Up */
.paw-petted-up {
  transform: translateY(-6px) scale(1.08);
  transition: transform 0.25s ease-out;
}

/* Steam Waves for Break Mug */
.steam-wave {
  animation: steamRise 1.8s ease-in-out infinite;
}

.steam-wave-delayed {
  animation: steamRise 1.8s ease-in-out infinite;
  animation-delay: 0.9s;
}

@keyframes steamRise {
  0% {
    opacity: 0.2;
    transform: translateY(0);
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 0;
    transform: translateY(-8px);
  }
}

/* Zzz Particles */
.zzz-1 {
  animation: zzzFloat 2.6s ease-out infinite;
}
.zzz-2 {
  animation: zzzFloat 2.6s ease-out infinite;
  animation-delay: 0.8s;
}
.zzz-3 {
  animation: zzzFloat 2.6s ease-out infinite;
  animation-delay: 1.6s;
}

@keyframes zzzFloat {
  0% {
    opacity: 0;
    transform: translate(0, 4px) scale(0.8);
  }
  40% {
    opacity: 0.9;
  }
  100% {
    opacity: 0;
    transform: translate(10px, -18px) scale(1.1);
  }
}

/* Sparkle Floating */
.sparkle-1 {
  animation: sparkleBounce 0.8s ease-in-out infinite alternate;
}
.sparkle-2 {
  animation: sparkleBounce 0.8s ease-in-out infinite alternate;
  animation-delay: 0.4s;
}

@keyframes sparkleBounce {
  0% {
    opacity: 0.4;
    transform: translateY(0) scale(0.9);
  }
  100% {
    opacity: 1;
    transform: translateY(-5px) scale(1.15);
  }
}

/* Walking Paws & Strides */
.paw-walk-left {
  transform-origin: 86px 148px;
  animation: walkStepLeft 0.3s ease-in-out infinite alternate;
}

.paw-walk-right {
  transform-origin: 154px 148px;
  animation: walkStepRight 0.3s ease-in-out infinite alternate;
  animation-delay: 0.15s;
}

@keyframes walkStepLeft {
  0% {
    transform: translate(-5px, -6px);
  }
  100% {
    transform: translate(5px, 3px);
  }
}

@keyframes walkStepRight {
  0% {
    transform: translate(5px, 3px);
  }
  100% {
    transform: translate(-5px, -6px);
  }
}

/* Held / Dragging dangling paws */
.paw-held-dangle-left {
  transform-origin: 86px 148px;
  animation: pawDangleLeft 0.5s ease-in-out infinite alternate;
}

.paw-held-dangle-right {
  transform-origin: 154px 148px;
  animation: pawDangleRight 0.5s ease-in-out infinite alternate;
  animation-delay: 0.25s;
}

@keyframes pawDangleLeft {
  0% {
    transform: translateY(6px) rotate(-8deg);
  }
  100% {
    transform: translateY(11px) rotate(4deg);
  }
}

@keyframes pawDangleRight {
  0% {
    transform: translateY(11px) rotate(4deg);
  }
  100% {
    transform: translateY(6px) rotate(-8deg);
  }
}

/* Accessibility: Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  .cat-breathing,
  .cat-blinking,
  .tail-group,
  .tail-wagging,
  .ear-twitch,
  .ear-twitch-delayed,
  .paw-bongo-left,
  .paw-bongo-right,
  .paw-focus-active,
  .paw-focus-active-delayed,
  .steam-wave,
  .steam-wave-delayed,
  .zzz-1,
  .zzz-2,
  .zzz-3,
  .sparkle-1,
  .sparkle-2 {
    animation: none !important;
  }
}
</style>
