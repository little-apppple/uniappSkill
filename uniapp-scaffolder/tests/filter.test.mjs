import { test } from 'node:test'
import assert from 'node:assert/strict'
import { matchTags, matchKeyword } from '../scripts/lib/filter.mjs'

const sample = [
  { id: 'a', title: 'Vue 3 Tabbar Starter', tags: ['vue3', 'tabbar', 'login-skeleton'] },
  { id: 'b', title: 'Vue 3 i18n',           tags: ['vue3', 'i18n'] },
  { id: 'c', title: 'Vue 2 Bare',           tags: ['vue2', 'bare'] },
]

test('matchTags: all mode requires every tag present (case-insensitive)', () => {
  assert.deepEqual(matchTags(sample, ['vue3', 'tabbar'], 'all').map(t => t.id), ['a'])
  assert.deepEqual(matchTags(sample, ['VUE3', 'TABBAR'], 'all').map(t => t.id), ['a'])
})

test('matchTags: any mode matches templates with at least one tag', () => {
  assert.deepEqual(matchTags(sample, ['tabbar', 'i18n'], 'any').map(t => t.id), ['a', 'b'])
})

test('matchTags: none mode excludes templates that have any of the listed tags', () => {
  assert.deepEqual(matchTags(sample, ['vue3'], 'none').map(t => t.id), ['c'])
})

test('matchTags: empty tag list returns the input unchanged', () => {
  assert.deepEqual(matchTags(sample, [], 'all'), sample)
})

test('matchKeyword: case-insensitive substring match on id and title', () => {
  assert.deepEqual(matchKeyword(sample, 'i18n').map(t => t.id), ['b'])
  assert.deepEqual(matchKeyword(sample, 'TAB').map(t => t.id), ['a'])
})

test('matchKeyword: empty keyword returns input unchanged', () => {
  assert.deepEqual(matchKeyword(sample, ''), sample)
})
