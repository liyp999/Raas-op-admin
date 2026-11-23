<script setup lang="ts">
import { computed } from 'vue'
import { RouterView } from 'vue-router'
import { NConfigProvider, NMessageProvider, NDialogProvider, zhCN, dateZhCN } from 'naive-ui'
import { useHudTheme } from '@/composables/useHudTheme'

/**
 * 等轴测「云平台」浅色主题：
 * 白蓝底 + 漂浮模块 + 细网格 + 柔和投影，主色可切换
 */
const FONT = "'Inter','PingFang SC','Microsoft YaHei',system-ui,-apple-system,sans-serif"

const { accent } = useHudTheme()

const themeOverrides = computed(() => {
  const a = accent.value
  return {
    common: {
      // 填充色用深一档的 soft，保证白字达到 4.5:1；accent 只做描边/光效等装饰色
      primaryColor: a.soft,
      primaryColorHover: a.pressed,
      primaryColorPressed: a.pressed,
      primaryColorSuppl: a.soft,
      infoColor: a.soft,
      successColor: '#0a7a58',
      warningColor: '#a35a0a',
      errorColor: '#c23a3a',
      textColorBase: '#17324f',
      textColor1: '#17324f',
      textColor2: '#43617f',
      textColor3: '#55708d',
      borderRadius: '12px',
      borderRadiusSmall: '8px',
      bodyColor: '#f2f8ff',
      cardColor: '#ffffff',
      modalColor: '#ffffff',
      popoverColor: '#ffffff',
      borderColor: '#dfeaf8',
      dividerColor: '#e8f1fc',
      fontFamily: FONT
    },
    DataTable: {
      thColor: '#eff7ff',
      thTextColor: '#3f6493',
      thFontWeight: '600',
      tdColor: 'transparent',
      tdColorHover: `rgba(${a.rgb}, 0.05)`,
      borderColor: '#e6f0fb',
      borderRadius: '12px'
    },
    Button: { borderRadius: '10px', fontWeight: '600' },
    Scrollbar: {
      color: `rgba(${a.rgb}, 0.4)`,
      colorHover: a.accent,
      railColor: 'rgba(47, 123, 255, 0.06)',
      railColorHover: 'rgba(47, 123, 255, 0.12)'
    },
    Input: {
      borderRadius: '10px',
      color: '#ffffff',
      border: '1px solid #dfeaf8',
      borderHover: `1px solid rgba(${a.rgb}, 0.45)`,
      borderFocus: `1px solid ${a.accent}`,
      boxShadowFocus: `0 0 0 3px rgba(${a.rgb}, 0.14)`
    },
    Tag: { borderRadius: '999px' },
    Card: { color: '#ffffff', borderColor: '#e7f1fc', borderRadius: '16px' },
    Modal: { color: '#ffffff' },
    Alert: { borderRadius: '12px' }
  }
})
</script>

<template>
  <n-config-provider :theme-overrides="themeOverrides" :locale="zhCN" :date-locale="dateZhCN">
    <n-message-provider>
      <n-dialog-provider>
        <div class="app-shell">
          <div class="iso-bg"></div>
          <div class="iso-chips" aria-hidden="true">
            <i class="chip c1"></i>
            <i class="chip c2"></i>
            <i class="chip c3"></i>
            <i class="chip c4"></i>
          </div>
          <div class="iso-beam"></div>
          <RouterView />
        </div>
      </n-dialog-provider>
    </n-message-provider>
  </n-config-provider>
</template>

<style>
:root {
  --hud-accent: #2f7bff;
  --hud-accent-hover: #5c98ff;
  --hud-accent-pressed: #1b5fd9;
  --hud-accent-soft: #1c5fd6;
  --hud-accent-rgb: 47, 123, 255;

  --iso-ink: #17324f;
  --iso-ink-2: #43617f;
  --iso-ink-3: #55708d;
  --iso-line: #e3eefb;
  --iso-card: rgba(255, 255, 255, 0.86);
}

html,
body,
#app {
  height: 100%;
  margin: 0;
  padding: 0;
}
body {
  background-color: #f2f8ff;
  color: var(--iso-ink);
  font-family: 'Inter', 'PingFang SC', 'Microsoft YaHei', system-ui, -apple-system, sans-serif;
  -webkit-font-smoothing: antialiased;
}

/* 页面底：白蓝渐变 + 主题色柔光 */
.app-shell {
  position: relative;
  min-height: 100vh;
  background:
    radial-gradient(900px 520px at 12% -10%, rgba(var(--hud-accent-rgb), 0.16), transparent 62%),
    radial-gradient(760px 460px at 92% 6%, rgba(120, 190, 255, 0.2), transparent 60%),
    linear-gradient(180deg, #f9fcff 0%, #eef5ff 52%, #e8f1fd 100%);
  overflow-x: hidden;
  transition: background 0.9s ease;
}

/* 动态层 1：等轴测网格（两条 30° 斜线交叉），缓慢漂移 */
.iso-bg {
  position: fixed;
  inset: -80px 0 0 -80px;
  z-index: 0;
  pointer-events: none;
  background-image:
    repeating-linear-gradient(30deg, rgba(var(--hud-accent-rgb), 0.09) 0 1px, transparent 1px 58px),
    repeating-linear-gradient(-30deg, rgba(var(--hud-accent-rgb), 0.09) 0 1px, transparent 1px 58px);
  -webkit-mask-image: radial-gradient(1200px 760px at 50% 12%, #000 25%, rgba(0, 0, 0, 0.35) 62%, transparent 88%);
  mask-image: radial-gradient(1200px 760px at 50% 12%, #000 25%, rgba(0, 0, 0, 0.35) 62%, transparent 88%);
  animation: iso-grid-drift 38s linear infinite;
}
@keyframes iso-grid-drift {
  from {
    background-position: 0 0, 0 0;
  }
  to {
    background-position: 58px 33px, -58px 33px;
  }
}

/* 动态层 2：漂浮的等轴测“模块” */
.iso-chips {
  position: fixed;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  overflow: hidden;
}
.chip {
  position: absolute;
  display: block;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(198, 222, 255, 0.9));
  box-shadow: 0 22px 34px -18px rgba(47, 110, 210, 0.55), inset 0 0 0 1px rgba(120, 165, 225, 0.28),
    inset 0 -8px 16px -8px rgba(60, 130, 235, 0.5);
  animation: chip-float 9s ease-in-out infinite;
}
.chip::after {
  content: '';
  position: absolute;
  inset: 18% 18% 30% 18%;
  border-radius: 8px;
  background: linear-gradient(135deg, rgba(var(--hud-accent-rgb), 0.22), rgba(255, 255, 255, 0.1));
}
.c1 {
  width: 96px;
  height: 96px;
  left: 6%;
  top: 16%;
  transform: rotate(45deg);
  opacity: 0.55;
}
.c2 {
  width: 66px;
  height: 66px;
  right: 8%;
  top: 26%;
  transform: rotate(45deg);
  opacity: 0.42;
  animation-delay: -2.6s;
}
.c3 {
  width: 120px;
  height: 120px;
  right: 4%;
  bottom: 12%;
  transform: rotate(45deg);
  opacity: 0.26;
  animation-delay: -4.4s;
}
.c4 {
  width: 54px;
  height: 54px;
  left: 14%;
  bottom: 18%;
  transform: rotate(45deg);
  opacity: 0.38;
  animation-delay: -6.2s;
}
@keyframes chip-float {
  0%,
  100% {
    translate: 0 0;
  }
  50% {
    translate: 0 -16px;
  }
}

/* 动态层 3：斜向流光 */
.iso-beam {
  position: fixed;
  left: -20%;
  top: 55%;
  width: 140%;
  height: 1px;
  z-index: 0;
  pointer-events: none;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(var(--hud-accent-rgb), 0.35),
    rgba(255, 255, 255, 0.9),
    rgba(var(--hud-accent-rgb), 0.35),
    transparent
  );
  transform: rotate(-14deg);
  opacity: 0.75;
  animation: beam-slide 7.5s ease-in-out infinite;
}
@keyframes beam-slide {
  0% {
    opacity: 0.25;
    transform: rotate(-14deg) translateX(-8%);
  }
  50% {
    opacity: 0.85;
    transform: rotate(-14deg) translateX(8%);
  }
  100% {
    opacity: 0.25;
    transform: rotate(-14deg) translateX(-8%);
  }
}

/* 换主题时柔和过渡 */
.panel,
.topbar,
.login-card,
.op-id {
  transition: border-color 0.9s ease, box-shadow 0.9s ease, color 0.9s ease, background-color 0.9s ease;
}

::selection {
  background: rgba(var(--hud-accent-rgb), 0.2);
}

@media (prefers-reduced-motion: reduce) {
  .iso-bg,
  .chip,
  .iso-beam {
    animation: none !important;
  }
  .iso-beam {
    display: none;
  }
}
</style>