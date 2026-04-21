import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isPersistentJsonStoreEnabled,
  persistentJsonStoreTableName,
} from '@/lib/server/persistent-json-store'

test('persistent json store uses a stable table name', () => {
  assert.equal(persistentJsonStoreTableName(), 'sk_state_store')
})

test('persistent json store enable flag returns boolean', () => {
  assert.equal(typeof isPersistentJsonStoreEnabled(), 'boolean')
})
