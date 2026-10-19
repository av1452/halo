import { idbDelete, idbGet, idbSet } from './idb'

describe('idb', () => {
  it('stores, reads and deletes values', async () => {
    await idbSet('greeting', { hello: 'world' })
    expect(await idbGet('greeting')).toEqual({ hello: 'world' })
    await idbDelete('greeting')
    expect(await idbGet('greeting')).toBeUndefined()
  })
})
