import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config'

// Gera os ícones do PWA a partir de public/logo.svg.
// O logo já é full-bleed (fundo da marca cobre todo o quadrado), então maskable/apple
// usam padding 0 — o fundo primary preenche a "safe zone" do Android e o iOS arredonda.
export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset: {
    ...minimal2023Preset,
    maskable: {
      sizes: [512],
      padding: 0,
      resizeOptions: { background: '#1E3A5F' },
    },
    apple: {
      sizes: [180],
      padding: 0,
      resizeOptions: { background: '#1E3A5F' },
    },
  },
  images: ['public/logo.svg'],
})
