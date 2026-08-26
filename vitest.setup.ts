import '@testing-library/jest-dom/vitest'

// Polyfill for maplibre-gl which needs URL.createObjectURL
if (!URL.createObjectURL) {
  URL.createObjectURL = () => 'blob:mock-url'
}
