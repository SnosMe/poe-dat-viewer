import fnv1a from '@sindresorhus/fnv1a'

export function fnv1a64 (data: string) {
  const hashHex = fnv1a(data, { size: 64 }).toString(16).padStart(16, '0')
  return [
    parseInt(hashHex.slice(14, 16), 16),
    parseInt(hashHex.slice(12, 14), 16),
    parseInt(hashHex.slice(10, 12), 16),
    parseInt(hashHex.slice(8, 10), 16),
    parseInt(hashHex.slice(6, 8), 16),
    parseInt(hashHex.slice(4, 6), 16),
    parseInt(hashHex.slice(2, 4), 16),
    parseInt(hashHex.slice(0, 2), 16)
  ]
}
