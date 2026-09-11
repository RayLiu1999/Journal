// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest'
import { mount } from '@vue/test-utils'
import ConfirmDialog from '../../app/components/ConfirmDialog.vue'
import MoodPicker from '../../app/components/MoodPicker.vue'
import MonthCalendar from '../../app/components/MonthCalendar.vue'

describe('MoodPicker', () => {
  it('renders accessible radio choices and toggles the selected mood', async () => {
    const wrapper = mount(MoodPicker, {
      props: { modelValue: null },
    })

    const radios = wrapper.findAll('[role="radio"]')
    expect(radios).toHaveLength(7)
    expect(radios[0]!.attributes('aria-checked')).toBe('false')

    await radios[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['😊']])

    await wrapper.setProps({ modelValue: '😊' })
    expect(radios[0]!.attributes('aria-checked')).toBe('true')
    await radios[0]!.trigger('click')
    expect(wrapper.emitted('update:modelValue')).toEqual([['😊'], [null]])
  })
})

describe('MonthCalendar', () => {
  it('renders the correct number of days and emits the selected date', async () => {
    const wrapper = mount(MonthCalendar, {
      props: {
        month: '2026-09',
        today: '2026-09-11',
        moods: { '2026-09-11': '😊' },
      },
    })

    const days = wrapper.findAll('button[aria-label]')
    expect(days).toHaveLength(30)
    expect(wrapper.find('[aria-label="九月十一日"]').text()).toContain('😊')
    expect(wrapper.find('[aria-label="九月十一日"]').classes()).toContain('bg-today')

    await wrapper.find('[aria-label="九月十一日"]').trigger('click')
    expect(wrapper.emitted('select')).toEqual([['2026-09-11']])
  })
})

describe('ConfirmDialog', () => {
  const props = {
    title: '刪除日記',
    message: '確定要刪除嗎？',
    confirmLabel: '刪除',
    open: true,
  }

  it('confirms and closes when the primary action is clicked', async () => {
    const wrapper = mount(ConfirmDialog, { props })
    const buttons = wrapper.findAll('button')

    expect(wrapper.find('[role="dialog"]').exists()).toBe(true)
    await buttons[1]!.trigger('click')

    expect(wrapper.emitted('confirm')).toHaveLength(1)
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })

  it('closes without confirming when cancelled', async () => {
    const wrapper = mount(ConfirmDialog, { props })
    await wrapper.findAll('button')[0]!.trigger('click')

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.emitted('update:open')).toEqual([[false]])
  })
})
