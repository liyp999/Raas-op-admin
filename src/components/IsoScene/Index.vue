<template>
  <div class="iso-scene" :class="{ compact }">
    <svg viewBox="0 0 620 480" role="img" aria-label="等轴测云平台示意">
      <defs>
        <linearGradient id="isoTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#e6f1ff" />
        </linearGradient>
        <linearGradient id="isoLeft" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#b6d1f3" />
          <stop offset="100%" stop-color="#98bae9" />
        </linearGradient>
        <linearGradient id="isoRight" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#dfeefd" />
          <stop offset="100%" stop-color="#c2d9f5" />
        </linearGradient>
        <linearGradient id="isoChipTop" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#ffffff" />
          <stop offset="100%" stop-color="#dcecff" />
        </linearGradient>
        <radialGradient id="isoGlow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stop-color="rgba(47,123,255,0.22)" />
          <stop offset="100%" stop-color="rgba(47,123,255,0)" />
        </radialGradient>
      </defs>

      <ellipse class="glow" cx="310" cy="300" rx="250" ry="180" fill="url(#isoGlow)" />
      <ellipse class="shadow" cx="310" cy="404" rx="176" ry="34" fill="rgba(70,120,190,0.16)" />

      <!-- 连接光束 -->
      <g class="beams">
        <path d="M150 336 L110 196" />
        <path d="M470 336 L500 214" />
        <path d="M236 372 L182 402" />
        <path d="M392 366 L450 398" />
      </g>

      <!-- 底层平台 -->
      <g class="layer-1">
        <polygon points="300,263.5 450,350 300,436.5 150,350" fill="url(#isoTop)" stroke="#b9cfec" stroke-width="1" />
        <polygon points="150,350 300,436.5 300,460 150,373.5" fill="url(#isoLeft)" />
        <polygon points="300,436.5 450,350 450,373.5 300,460" fill="url(#isoRight)" />
      </g>

      <!-- 中层平台 -->
      <g class="layer-2">
        <polygon points="300,266 424,338 300,410 176,338" fill="url(#isoTop)" stroke="#bfd5ee" stroke-width="1" />
        <polygon points="176,338 300,410 300,428 176,356" fill="url(#isoLeft)" />
        <polygon points="300,410 424,338 424,356 300,428" fill="url(#isoRight)" />
        <circle cx="230" cy="356" r="4" fill="rgba(47,123,255,0.35)" />
        <circle cx="368" cy="355" r="4" fill="rgba(47,123,255,0.35)" />
      </g>

      <!-- 上层平台 -->
      <g class="layer-3">
        <polygon points="300,269 398,325.5 300,382 202,325.5" fill="url(#isoTop)" stroke="#c6d9ee" stroke-width="1" />
        <polygon points="202,325.5 300,382 300,396 202,339.5" fill="url(#isoLeft)" />
        <polygon points="300,382 398,325.5 398,339.5 300,396" fill="url(#isoRight)" />
      </g>

      <!-- 主体机箱 -->
      <g class="core">
        <polygon points="300,225 375,268.5 300,312 225,268.5" fill="url(#isoTop)" stroke="#bcd0e9" stroke-width="1" />
        <polygon points="225,268.5 300,312 300,374 225,330.5" fill="url(#isoLeft)" />
        <polygon points="300,312 375,268.5 375,330.5 300,374" fill="url(#isoRight)" />

        <!-- 正面散热条 -->
        <g fill="rgba(255,255,255,0.72)">
          <polygon points="225,283 300,326.5 300,330 225,286.5" />
          <polygon points="225,296 300,339.5 300,343 225,299.5" />
          <polygon points="225,309 300,352.5 300,356 225,312.5" />
        </g>
        <!-- 状态灯 -->
        <circle cx="286" cy="306" r="5" fill="var(--hud-accent)" opacity="0.85" />
        <circle cx="304" cy="316" r="3" fill="#12b886" opacity="0.75" />

        <!-- 顶部屏 -->
        <polygon points="300,241 348,268.7 300,296.4 252,268.7" fill="#ffffff" stroke="#cddff2" stroke-width="1" />
        <g fill="rgba(47,123,255,0.22)">
          <polygon points="300,251 336,271.5 300,292 264,271.5" />
        </g>
        <g fill="#ffffff" opacity="0.85">
          <polygon points="300,256 328,272 300,288 272,272" />
        </g>
      </g>

      <!-- 浮动模块 -->
      <g class="chip chip-a">
        <polygon points="110,158 140,175 110,192 80,175" fill="url(#isoChipTop)" stroke="#c3d5ec" stroke-width="1" />
        <polygon points="80,175 110,192 110,208 80,191" fill="url(#isoLeft)" />
        <polygon points="110,192 140,175 140,191 110,208" fill="url(#isoRight)" />
        <polygon points="110,169 122,176 110,183 98,176" fill="rgba(47,123,255,0.35)" />
      </g>
      <g class="chip chip-b">
        <polygon points="502,186 538,207 502,228 466,207" fill="url(#isoChipTop)" stroke="#c3d5ec" stroke-width="1" />
        <polygon points="466,207 502,228 502,247 466,226" fill="url(#isoLeft)" />
        <polygon points="502,228 538,207 538,226 502,247" fill="url(#isoRight)" />
        <polygon points="502,199 516,207 502,215 488,207" fill="rgba(18,184,134,0.3)" />
      </g>
      <g class="chip chip-c">
        <polygon points="176,396 202,411 176,426 150,411" fill="url(#isoChipTop)" stroke="#c3d5ec" stroke-width="1" />
        <polygon points="150,411 176,426 176,439 150,424" fill="url(#isoLeft)" />
        <polygon points="176,426 202,411 202,424 176,439" fill="url(#isoRight)" />
      </g>
      <g class="chip chip-d">
        <polygon points="456,394 486,411 456,428 426,411" fill="url(#isoChipTop)" stroke="#c3d5ec" stroke-width="1" />
        <polygon points="426,411 456,428 456,442 426,425" fill="url(#isoLeft)" />
        <polygon points="456,428 486,411 486,425 456,442" fill="url(#isoRight)" />
        <polygon points="456,404 468,411 456,418 444,411" fill="rgba(47,123,255,0.3)" />
      </g>

      <!-- 漂浮图标 -->
      <g class="float-icon icon-cloud">
        <path
          d="M148 108c0-9 7-16 16-16 6 0 11 3 14 8 2-1 4-2 6-2 9 0 16 7 16 16 0 9-7 15-16 15h-27c-9 0-16-6-16-15z"
          fill="rgba(255,255,255,0.9)"
          stroke="#cfe1f7"
          stroke-width="1"
        />
      </g>
      <g class="float-icon icon-bar">
        <rect x="392" y="112" width="58" height="10" rx="5" fill="rgba(255,255,255,0.95)" stroke="#d5e6fa" stroke-width="1" />
        <rect x="404" y="128" width="38" height="8" rx="4" fill="rgba(47,123,255,0.25)" />
      </g>
    </svg>
  </div>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ compact?: boolean }>(), { compact: false })
</script>

<style scoped>
.iso-scene {
  width: 100%;
  max-width: 620px;
  aspect-ratio: 620 / 480;
  animation: sceneFloat 11s ease-in-out infinite;
  filter: drop-shadow(0 30px 34px rgba(58, 116, 200, 0.16));
}
.iso-scene.compact {
  max-width: 340px;
}
svg {
  width: 100%;
  height: 100%;
  display: block;
  overflow: visible;
}
@keyframes sceneFloat {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-14px);
  }
}

/* 光束流动 */
.beams path {
  stroke: rgba(47, 123, 255, 0.45);
  stroke-width: 1.4;
  stroke-dasharray: 7 11;
  fill: none;
  animation: beamFlow 3.6s linear infinite;
}
.beams path:nth-child(2) {
  animation-delay: -0.9s;
}
.beams path:nth-child(3) {
  animation-delay: -1.8s;
}
.beams path:nth-child(4) {
  animation-delay: -2.7s;
}
@keyframes beamFlow {
  to {
    stroke-dashoffset: -36;
  }
}

/* 平台分层轻微呼吸 */
.layer-1,
.layer-2,
.layer-3 {
  animation: layerLift 7.5s ease-in-out infinite;
}
.layer-2 {
  animation-delay: -2.5s;
}
.layer-3 {
  animation-delay: -5s;
}
@keyframes layerLift {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}

/* 浮动模块错峰上下浮动 */
.chip {
  animation: chipBob 6.5s ease-in-out infinite;
}
.chip-a {
  animation-delay: -0.4s;
}
.chip-b {
  animation-delay: -2s;
}
.chip-c {
  animation-delay: -3.4s;
}
.chip-d {
  animation-delay: -4.6s;
}
@keyframes chipBob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-9px);
  }
}
.float-icon {
  animation: iconBob 8s ease-in-out infinite;
}
.icon-bar {
  animation-delay: -3s;
}
@keyframes iconBob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-12px);
  }
}
.glow {
  animation: glowBreath 6s ease-in-out infinite;
}
@keyframes glowBreath {
  0%,
  100% {
    opacity: 0.55;
  }
  50% {
    opacity: 0.95;
  }
}

@media (prefers-reduced-motion: reduce) {
  .iso-scene,
  .beams path,
  .layer-1,
  .layer-2,
  .layer-3,
  .chip,
  .float-icon,
  .glow {
    animation: none !important;
  }
}
</style>
