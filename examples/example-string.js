const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'.split('')

export function exampleString (size = 16) {
  const result = new Array(size)
  for (let i = 0; i < size; i++) {
    const ix = Math.floor(Math.random() * characters.length)
    result[i] = characters[ix]
  }
  return result.join('')
}
